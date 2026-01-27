/**
 * Geocoding utilities for converting county/city names to coordinates and bounding boxes
 * Uses Google Geocoding API with caching
 */

import { invariant } from "es-toolkit";
import ora from "ora";
import zod from "zod";
import { trackApiCall } from "~/lib/apiUsageTracker";
import envVars from "~/lib/env";
import prisma from "~/lib/prisma.server";

const geocodeResultSchema = zod.object({
  results: zod.array(
    zod.object({
      geometry: zod.object({
        location: zod.object({
          lat: zod.number(),
          lng: zod.number(),
        }),
        bounds: zod
          .object({
            northeast: zod.object({
              lat: zod.number(),
              lng: zod.number(),
            }),
            southwest: zod.object({
              lat: zod.number(),
              lng: zod.number(),
            }),
          })
          .optional(),
        viewport: zod.object({
          northeast: zod.object({
            lat: zod.number(),
            lng: zod.number(),
          }),
          southwest: zod.object({
            lat: zod.number(),
            lng: zod.number(),
          }),
        }),
      }),
      formatted_address: zod.string(),
    }),
  ),
  status: zod.string(),
});

export interface LatLng {
  lat: number;
  lng: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface GeocodedCounty {
  center: LatLng;
  bounds: BoundingBox;
  formattedAddress: string;
}

/**
 * Geocode a county or city name to get coordinates and bounding box
 *
 * @param countyName County or city name (e.g., "Los Angeles County, CA")
 * @returns Center coordinates and bounding box
 */
export async function geocodeCounty(
  countyName: string,
): Promise<GeocodedCounty> {
  const spinner = ora(`Geocoding ${countyName}`).start();

  try {
    // Normalize cache key
    const key = `geocode:${countyName.toLowerCase().replace(/\s+/g, "-")}`;

    // Check cache
    const cached = await prisma.cache.findUnique({ where: { key } });
    if (cached) {
      spinner.succeed(`Geocoding ${countyName} (cached)`);
      return cached.value as unknown as GeocodedCounty;
    }

    // Call Google Geocoding API
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", countyName);
    url.searchParams.set("key", envVars.GOOGLE_PLACES_API_KEY);

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "rentail.space/1.0 (support@rentail.space)" },
    });

    invariant(response.ok, `Geocoding API failed: ${response.statusText}`);

    // Track API usage
    const result = await trackApiCall(
      "google-geocoding",
      "geocode",
      async () => {
        const data = geocodeResultSchema.parse(await response.json());
        invariant(
          data.status === "OK",
          `Geocoding failed for ${countyName}: ${data.status}`,
        );
        invariant(
          data.results.length > 0,
          `No results found for ${countyName}`,
        );
        return data.results[0];
      },
    );

    const { geometry, formatted_address } = result;

    // Use bounds if available, otherwise use viewport
    const bounds = geometry.bounds ?? geometry.viewport;

    const geocoded: GeocodedCounty = {
      center: {
        lat: geometry.location.lat,
        lng: geometry.location.lng,
      },
      bounds: {
        north: bounds.northeast.lat,
        south: bounds.southwest.lat,
        east: bounds.northeast.lng,
        west: bounds.southwest.lng,
      },
      formattedAddress: formatted_address,
    };

    // Cache result (indefinite TTL for geographic data)
    await prisma.cache.create({
      data: { key, value: geocoded as never },
    });

    spinner.succeed(`Geocoded ${countyName}`);
    return geocoded;
  } catch (error) {
    spinner.fail(`Failed to geocode ${countyName}`);
    throw error;
  }
}

/**
 * Merge multiple bounding boxes into one
 *
 * @param boxes Array of bounding boxes to merge
 * @returns Single bounding box encompassing all inputs
 */
export function mergeBounds(boxes: BoundingBox[]): BoundingBox {
  invariant(boxes.length > 0, "Cannot merge empty array of bounds");
  const coverage = {
    north: Math.max(...boxes.map((b) => b.north)),
    south: Math.min(...boxes.map((b) => b.south)),
    east: Math.max(...boxes.map((b) => b.east)),
    west: Math.min(...boxes.map((b) => b.west)),
  };
  return coverage;
}

/**
 * Geocoding utilities for converting county/city names to coordinates and bounding boxes
 * Uses Google Geocoding API with caching
 */

import { trackApiCall } from "~/lib/apiUsageTracker";
import { daysAgo } from "~/lib/temporal";
import invariant from "tiny-invariant";
import envVars from "~/lib/env";
import ora from "ora";
import zod from "zod";

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

interface GeocodedCounty {
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
    // Call Google Geocoding API
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", countyName);
    url.searchParams.set("key", envVars.GOOGLE_PLACES_API_KEY);

    // Track API usage
    const { data: result } = await trackApiCall(
      {
        newerThan: daysAgo(30),
        defaultValue: null,
        endpoint: "geocode",
        key: `geocode:${countyName.toLowerCase().replace(/\s+/g, "-")}`,
        service: "google-geocoding",
      },
      async () => {
        const response = await fetch(url.toString(), {
          headers: {
            "User-Agent": "rentail.space/1.0 (support@rentail.space)",
          },
        });

        if (!response.ok) {
          throw new Error(`Geocoding API failed: ${response.statusText}`);
        }

        const data = geocodeResultSchema.parse(await response.json());
        if (data.status !== "OK")
          throw new Error(`Geocoding failed for ${countyName}: ${data.status}`);
        if (data.results.length === 0)
          throw new Error(`No results found for ${countyName}`);
        return data.results[0];
      },
    );
    if (!result) throw new Error(`Geocoding failed for ${countyName}`);

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

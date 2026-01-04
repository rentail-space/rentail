/**
 * Nearby search wrapper with caching and rate limiting
 * Used by grid-based collection for comprehensive coverage
 */

import type { InputJsonValue } from "@prisma/client/runtime/client";
import ora from "ora";
import prisma from "../prisma";
import { searchNearbyRaw } from "./fromGooglePlaces";
import type { LatLng } from "./geocoding";
import RateLimiter from "./rateLimiter";

const rateLimiter = new RateLimiter(50); // 50ms minimum delay between calls

export interface PlaceResult {
  address: string;
  city: string;
  displayName: { text: string };
  location: LatLng;
  placeID: string;
  state: string;
  websiteUri: string;
}

/**
 * Search for shopping malls near a location with caching
 *
 * @param location Center point
 * @param radiusMeters Search radius in meters (max 50,000)
 * @returns Array of place results (ID, name, location)
 */
export async function nearbySearch(
  location: LatLng,
  radiusMeters: number,
): Promise<PlaceResult[]> {
  const spinner = ora(
    `Searching near (${location.lat.toFixed(3)}, ${location.lng.toFixed(3)})`,
  ).start();

  try {
    // Create cache key
    const key = `nearby-search:${location.lat.toFixed(6)},${location.lng.toFixed(6)}:${radiusMeters}`;

    // Check cache
    const cached = await prisma.cache.findUnique({ where: { key } });
    if (cached) {
      spinner.succeed(
        `Nearby search (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}) - cached`,
      );
      return cached.value as unknown as PlaceResult[];
    }

    // Rate limit before API call
    await rateLimiter.throttle();

    // Call API with retry logic
    const places = await searchNearbyRaw({ location, radiusMeters });

    // Convert to simplified result format
    const results: PlaceResult[] = places.map((place) => {
      return {
        address: place.addressComponents
          .filter(
            (component) =>
              component.types.includes("street_number") ||
              component.types.includes("route"),
          )
          .map((component) => component.longText)
          .join(", "),
        city:
          place.addressComponents.find((component) =>
            component.types.includes("locality"),
          )?.longText ?? "",
        displayName: place.displayName,
        location: {
          lat: place.location.latitude,
          lng: place.location.longitude,
        },
        placeID: place.name,
        state:
          place.addressComponents.find((component) =>
            component.types.includes("administrative_area_level_1"),
          )?.shortText ?? "",
        websiteUri: place.websiteUri ?? "",
      };
    });

    // Cache results (30-day TTL)
    await prisma.cache.create({
      data: {
        key,
        value: results as unknown as InputJsonValue,
      },
    });

    spinner.succeed(
      `Found ${results.length} centers near (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`,
    );
    return results;
  } catch (error) {
    spinner.fail(
      `Nearby search failed at (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`,
    );
    throw error;
  }
}

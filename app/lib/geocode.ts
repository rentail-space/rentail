import { captureException } from "@sentry/react-router";
import debug from "debug";
import { invariant } from "es-toolkit";
import type { User } from "prisma/generated/client";
import { cleanParseWorkingMemory } from "./workingMemory";

const fallbackLocation = {
  ip: "23.241.26.38",
  latitude: 39.8283,
  longitude: -98.5795,
  displayName: "",
  timeZone: "America/Los_Angeles",
};

type GeocodedLocation = {
  city?: string;
  country?: string;
  displayName: string;
  ip: string;
  latitude: number;
  longitude: number;
  state?: string;
  timezone: string;
};

const logger = debug("geocode");

/**
 * Try in this order:
 *   working memory (if user exists) ->
 *   geocode request headers ->
 *   fallback to LA midcity
 */
export async function geocodeMemoryOrHeaders({
  user,
  headers,
}: {
  user?: User;
  headers: Headers;
}): Promise<{
  displayName: string;
  longitude: number;
  latitude: number;
}> {
  try {
    invariant(user, "User is expected");
    const { location } = cleanParseWorkingMemory(user.workingMemory);
    const { longitude, latitude } = location ?? {};
    const displayName = [location?.city, location?.state, location?.country]
      .filter(Boolean)
      .join(", ");
    invariant(displayName, "DisplayName is expected");
    invariant(longitude, "Longitude is expected");
    invariant(latitude, "Latitude is expected");
    return { displayName, longitude, latitude };
  } catch {
    const { location } = await geocodeFromHeaders(headers);
    return location;
  }
}

/**
 * Get the location information from the headers: IP, latitude, longitude, city,
 * state, country, and time zone.  If the location information is not found,
 * return a fallback location. The fallback location is Los Angeles, California.
 *
 * @param requestHeaders - The headers object
 * @returns The location information from the headers or the fallback location
 */
export async function geocodeFromHeaders(requestHeaders: Headers): Promise<{
  ip?: string;
  location: {
    city?: string;
    country?: string;
    displayName: string;
    latitude: number;
    longitude: number;
    state?: string;
    timeZone?: string;
  };
}> {
  const ip = requestHeaders.get("x-real-ip");
  if (!ip) return { ip: undefined, location: fallbackLocation };
  try {
    const city = decodeURIComponent(
      requestHeaders.get("x-vercel-ip-city") ?? "",
    );
    const country = decodeURIComponent(
      requestHeaders.get("x-vercel-ip-country") ?? "",
    );
    const state = decodeURIComponent(
      requestHeaders.get("x-vercel-ip-country-region") ?? "",
    );
    const timeZone =
      requestHeaders.get("x-vercel-ip-timezone") ?? "America/Los_Angeles";

    const latitude = Number.parseFloat(
      requestHeaders.get("x-vercel-ip-latitude") ?? "34.0456",
    );
    const longitude = Number.parseFloat(
      requestHeaders.get("x-vercel-ip-longitude") ?? "-118.2694",
    );

    const displayName = [city, state, country].filter(Boolean).join(", ");
    if (displayName)
      return {
        ip,
        location: {
          city,
          country,
          displayName,
          latitude,
          longitude,
          state,
          timeZone,
        },
      };
    else {
      const [location, timeZone] = await Promise.all([
        geocodeFromIP(ip),
        getTimezoneFromIP(ip),
      ]);
      return { ip, location: { ...location, timeZone } };
    }
  } catch (error) {
    console.error("Error getting geocode from headers: %s", error);
    return { ip, location: fallbackLocation };
  }
}

/**
 * Generally we use Vercel IP geolocation headers, but when not available, we
 * can use this API to geocode from an IP address.
 *
 * @param ip - The IP address to geocode.
 * @returns The geocoded location.
 * @throws If the IP address is not valid or the API request fails.
 */
async function geocodeFromIP(
  ip: string,
): Promise<Omit<GeocodedLocation, "ip" | "timezone">> {
  const url = new URL("https://api.ipgeolocation.io/v2/ipgeo");
  url.searchParams.set("apiKey", "9b97f61156b74297a2967c6ace8374c0");
  url.searchParams.set("ip", ip);
  const response = await fetch(url);
  invariant(response.ok, "Failed to geocode from IP");

  const data = (await response.json()) as {
    location: {
      city: string; // eg "Los Angeles",
      country_code2: string; // eg "US",
      latitude: string; // eg "34.05361",
      longitude: string; // eg "-118.24550",
      state_code: string; // eg "US-CA",
    };
  };
  const city = decodeURIComponent(data.location.city);
  const country = decodeURIComponent(data.location.country_code2);
  const state = decodeURIComponent(data.location.state_code.split("-")[1]);
  const displayName = [city, state, country].filter(Boolean).join(", ");
  logger("Geocoded location from IP %s => %s", ip, displayName);

  return {
    city,
    country,
    displayName,
    latitude: Number.parseFloat(data.location.latitude),
    longitude: Number.parseFloat(data.location.longitude),
    state,
  };
}

/**
 * Generally we use Vercel IP geolocation headers, but when not available, we
 * can use this API to get the timezone from an IP address.
 *
 * @param ip - The IP address to get the timezone for.
 * @returns The timezone for the IP address.
 * @throws If the IP address is not valid or the API request fails.
 */
async function getTimezoneFromIP(ip: string): Promise<string> {
  const url = new URL("https://api.ipgeolocation.io/v2/timezone");
  url.searchParams.set("apiKey", "9b97f61156b74297a2967c6ace8374c0");
  url.searchParams.set("ip", ip);
  const response = await fetch(url);
  invariant(response.ok, "Failed to get timezone");

  const data = (await response.json()) as {
    timezone: {
      name: string; // eg "America/Los_Angeles",
    };
  };
  const timezone = data.timezone.name;
  logger("Timezone from IP %s => %s", ip, timezone);
  return timezone;
}

/**
 * We use this to geocode user input from working memory, eg if they enter
 * "Boston centeral", we need to geocode it to get the latitude and longitude of
 * Boston and also set the display name for our benefit.
 *
 * @param location - The location to geocode.
 * @returns The geocoded location or null if the location is not found.
 */
export async function geocodeFromUserInput(location: string): Promise<{
  displayName: string;
  latitude: number;
  longitude: number;
} | null> {
  if (!location.trim()) return null;

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", location);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const response = await fetch(url, {
      headers: { "User-Agent": "rentail.space/1.0 (support@rentail.space)" },
      signal: AbortSignal.timeout(2_000),
    });
    const results = (await response.json()) as Array<{
      place_id: number;
      display_name: string;
      lat: string;
      lon: string;
    }>;
    invariant(results.length > 0, "No results found");
    // NOTE: Handle strings like "Las%20Vegas, NV, US" properly.
    const displayName = decodeURIComponent(results[0].display_name);

    logger("Geocoded location from user input %s => %s", location, displayName);
    return {
      displayName,
      latitude: Number.parseFloat(results[0].lat),
      longitude: Number.parseFloat(results[0].lon),
    };
  } catch (error) {
    captureException(error, { extra: { location } });
    logger("Error geocoding location %s: %s", location, error);
    return null;
  }
}

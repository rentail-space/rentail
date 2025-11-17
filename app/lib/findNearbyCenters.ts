import { captureException } from "@sentry/react-router";
import debug from "debug";
import type { User } from "prisma/generated/client";
import type { PropertyGetPayload } from "prisma/generated/models";
import prisma from "~/lib/prisma";
import { cleanParseProfile } from "./userProfile";

/**
 * Fallback on the the latitude/longitude of LA midcity.
 */
const midcity = {
  latitude: 34.04592,
  longitude: -118.34574,
};

const logger = debug("geocode");

/**
 * Find the shopping centers within a given distance from the user. Gets the
 * current location from working memory, updates it, if necessary. Returns a
 * list of centers with only their available spaces.
 *
 * @param headers The HTTP headers to use to get the user's location.
 * @param user The user to find the shopping centers for. If not provided, the
 * location will be inferred from the IP address in the headers.
 * @returns A list of centers with only their available spaces.
 */
export default async function findNearbyCenters({
  headers,
  user,
}: {
  headers: Headers;
  user?: User;
}): Promise<PropertyGetPayload<{ include: { spaces: true } }>[]> {
  const { longitude, latitude } = await getLocation({ user, headers });

  const maxDistance = 30; // miles
  return await prisma.property.findMany({
    include: {
      spaces: {
        where: { available: true },
      },
    },
    where: {
      latitude: {
        gte: latitude - maxDistance / 69.172,
        lte: latitude + maxDistance / 69.172,
      },
      longitude: {
        gte: longitude - maxDistance / 57.393,
        lte: longitude + maxDistance / 57.393,
      },
    },
  });
}

/**
 * Try in this order: working memory -> geocode request headers -> default to
 * LA midcity.
 */
async function getLocation({
  user,
  headers,
}: {
  user?: User;
  headers: Headers;
}): Promise<{ longitude: number; latitude: number }> {
  const fromMemory = user && (await locationFromWorkingMemory(user));
  if (fromMemory?.longitude && fromMemory.latitude) return fromMemory;
  const fromHeaders = await locationFromHeaders(headers);
  if (fromHeaders?.longitude && fromHeaders.latitude) return fromHeaders;

  logger("Fallback location: midcity, Los Angeles, California");
  return midcity;
}

async function locationFromHeaders(
  headers: Headers,
): Promise<{ longitude: number; latitude: number } | undefined> {
  const longitude = Number.parseFloat(
    headers.get("x-vercel-ip-longitude") ?? "0",
  );
  const latitude = Number.parseFloat(
    headers.get("x-vercel-ip-latitude") ?? "0",
  );
  const { city, state, country } = {
    city: headers.get("x-vercel-ip-city"),
    state: headers.get("x-vercel-ip-country-region"),
    country: headers.get("x-vercel-ip-country"),
  };
  if (city && state && country)
    logger("Location from headers: %s %s %s", city, state, country);
  return longitude && latitude ? { longitude, latitude } : undefined;
}

async function locationFromWorkingMemory(
  user: User,
): Promise<{ longitude: number; latitude: number } | undefined> {
  try {
    const { workingMemory } = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { workingMemory: true },
    });
    const { location } = cleanParseProfile(workingMemory);
    const { city, state, country } = location ?? {};
    if (city && state && country)
      logger("Location from working memory: %s %s %s", city, state, country);
    const { longitude, latitude } = location ?? {};
    return longitude && latitude ? { longitude, latitude } : undefined;
  } catch (error) {
    captureException(error, { extra: { user } });
    console.error("Error getting location from working memory: %s", error);
  }
}

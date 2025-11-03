import { captureException } from "@sentry/react-router";
import { Redis } from "ioredis";
import type { User } from "prisma/generated/client";
import type { PropertyGetPayload } from "prisma/generated/models";
import prisma from "~/lib/prisma";
import env from "./env";
import { cleanParse } from "./userProfile";

/**
 * Find the shopping centers within a given distance from the user. Gets the
 * current location from working memory, updates it, if necessary.
 *
 * @param user The user to find the shopping centers for.
 * @param maxDistance The distance in miles to find the shopping centers within.
 * @returns Markup with shopping centers and spaces based on distance
 */
export default async function findNearbyProperties(
  user: User,
): Promise<PropertyGetPayload<{ include: { spaces: true } }>[]> {
  const { longitude, latitude } = await locationFromWorkingMemory(user);
  if (!longitude || !latitude) return [];

  const redis = new Redis(env.REDIS_URL);
  const maxDistance = 45; // miles
  const key = `properties:${latitude}:${longitude}:${maxDistance}`;
  const cachedProperties = await redis.get(key);
  if (cachedProperties) return JSON.parse(cachedProperties);

  const properties = await prisma.property.findMany({
    include: { spaces: true },
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
  await redis.set(key, JSON.stringify(properties));
  await redis.expire(key, 60 * 60 * 24 * 30); // 30 days
  return properties;
}

async function locationFromWorkingMemory(
  user: User,
): Promise<{ longitude?: number; latitude?: number }> {
  try {
    const { workingMemory } = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { workingMemory: true },
    });
    const { location } = cleanParse(workingMemory);
    return { longitude: location?.longitude, latitude: location?.latitude };
  } catch (error) {
    captureException(error, { extra: { user } });
    return {};
  }
}

import type {
  ChatGetPayload,
  PropertyGetPayload,
} from "prisma/generated/models";
import prisma from "~/lib/prisma";
import { getWorkingMemory } from "~/lib/workingMemory";

/**
 * Find the shopping centers within a given distance from the user. Gets the
 * current location from working memory, updates it, if necessary.
 *
 * @param chat The chat to find the shopping centers for.
 * @param maxDistance The distance in miles to find the shopping centers within.
 * @returns Markup with shopping centers and spaces based on distance
 */
export default async function findNearbyProperties({
  chat,
  maxDistance,
}: {
  chat: ChatGetPayload<{ include: { user: true } }>;
  maxDistance: number;
}): Promise<PropertyGetPayload<{ include: { spaces: true } }>[]> {
  const { longitude, latitude } = await locationFromWorkingMemory(chat);
  if (!longitude || !latitude) return [];

  return await prisma.property.findMany({
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
}

async function locationFromWorkingMemory(
  chat: ChatGetPayload<{ include: { user: true } }>,
): Promise<{ longitude?: number; latitude?: number }> {
  const { location } = await getWorkingMemory(chat);
  return {
    longitude: location?.longitude ?? 0,
    latitude: location?.latitude ?? 0,
  };
}

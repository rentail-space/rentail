import type { User } from "prisma/generated";
import type { PropertyGetPayload } from "prisma/generated/models";
import prisma from "~/lib/prisma.server";
import { geocodeFromUserInput, geocodeMemoryOrHeaders } from "./geocode";
import { cleanParseWorkingMemory } from "./workingMemory";

/**
 * Find the shopping centers within a given distance from the user. Gets the
 * current location from working memory. The list is ordered by:
 * - Higher ranking
 * - Has a phone number (so the user can contact the center directly)
 * - Alphabetically
 *
 * @param headers The HTTP headers to use to get the user's location.
 * @param user The user to find the shopping centers for. If not provided, the
 * location will be inferred from the IP address in the headers.
 * @param maxDistance The maximum distance in miles to search for shopping centers.
 * @param limit The maximum number of shopping centers to return.
 * @returns A list of centers with only their available spaces and the
 * location's display name.
 */
export default async function findNearbyCenters({
  headers,
  user,
  limit = 10,
  location,
  maxDistance = 30,
}: {
  headers: Headers;
  user?: User;
  limit?: number;
  location?: string;
  maxDistance?: number;
}): Promise<{
  centers: PropertyGetPayload<{ include: { spaces: true; state: true } }>[];
  displayName: string;
}> {
  const workingMemoryLocation = user
    ? cleanParseWorkingMemory(user.workingMemory).location
    : undefined;
  const { displayName, longitude, latitude } =
    (location && (await geocodeFromUserInput(location))) ||
    (await geocodeMemoryOrHeaders({
      location: workingMemoryLocation,
      headers,
    }));

  const centers = await prisma.property.findMany({
    include: {
      spaces: {
        where: { available: true },
      },
      state: true,
    },
    orderBy: [
      { ranking: { sort: "desc", nulls: "last" } },
      { phone: { sort: "asc", nulls: "last" } },
    ],
    take: limit,
    where: {
      latitude: {
        gte: latitude - maxDistance / 69.172,
        lte: latitude + maxDistance / 69.172,
      },
      longitude: {
        gte: longitude - maxDistance / 57.393,
        lte: longitude + maxDistance / 57.393,
      },
      rating: { gte: 4 },
    },
  });
  // Sort for presentation: ranking (desc, nulls last), phone present first,
  // then alphabetically. This re-establishes the DB ordering (which a plain
  // alphabetical sort would erase) and prioritizes centers the user can
  // actually call directly among equal-ranking centers.
  centers.sort((a, b) => {
    const rankA = a.ranking ?? -Infinity;
    const rankB = b.ranking ?? -Infinity;
    if (rankA !== rankB) return rankB - rankA;
    const phoneA = a.phone ? 0 : 1;
    const phoneB = b.phone ? 0 : 1;
    if (phoneA !== phoneB) return phoneA - phoneB;
    return a.name.localeCompare(b.name);
  });
  return { centers, displayName };
}

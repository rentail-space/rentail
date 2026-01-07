import type { User } from "prisma/generated/client";
import type { PropertyGetPayload } from "prisma/generated/models";
import prisma from "~/lib/prisma";
import { geocodeFromUserInput, geocodeMemoryOrHeaders } from "./geocode";

/**
 * Find the shopping centers within a given distance from the user. Gets the
 * current location from working memory. The list is ordered by:
 * - More available spaces
 * - Higher ranking
 * - Alphabetically
 *
 * @param headers The HTTP headers to use to get the user's location.
 * @param user The user to find the shopping centers for. If not provided, the
 * location will be inferred from the IP address in the headers.
 * @returns A list of centers with only their available spaces and the
 * location's display name.
 */
export default async function findNearbyCenters({
  headers,
  user,
  limit = 10,
  location,
}: {
  headers: Headers;
  user?: User;
  limit?: number;
  location?: string;
}): Promise<{
  centers: PropertyGetPayload<{ include: { spaces: true } }>[];
  displayName: string;
}> {
  const { displayName, longitude, latitude } =
    (location && (await geocodeFromUserInput(location))) ||
    (await geocodeMemoryOrHeaders({ user, headers }));

  const maxDistance = 30; // miles
  const centers = await prisma.property.findMany({
    include: {
      spaces: {
        where: { available: true },
      },
    },
    orderBy: [
      { spaces: { _count: "desc" } },
      { ranking: "desc" },
      { name: "asc" },
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
  return { centers, displayName };
}

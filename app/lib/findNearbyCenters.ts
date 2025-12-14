import prisma from "~/lib/prisma";
import { useMemoryOrHeaders } from "./geocode";
import type { User } from "prisma/generated/client";
import type { PropertyGetPayload } from "prisma/generated/models";

/**
 * Find the shopping centers within a given distance from the user. Gets the
 * current location from working memory, updates it, if necessary. Returns a
 * list of centers with only their available spaces and the location's display
 * name.
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
}: {
  headers: Headers;
  user?: User;
}): Promise<{
  centers: PropertyGetPayload<{ include: { spaces: true } }>[];
  displayName: string;
}> {
  const { displayName, longitude, latitude } = await useMemoryOrHeaders({
    user,
    headers,
  });

  const maxDistance = 30; // miles
  const centers = await prisma.property.findMany({
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
  return { centers, displayName };
}

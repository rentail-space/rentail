import type { PropertySpace } from "prisma/generated/client";
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
export default async function findNearbySpaces({
  chat,
  maxDistance,
}: {
  chat: ChatGetPayload<{ include: { user: true } }>;
  maxDistance: number;
}): Promise<string> {
  const location = await locationFromWorkingMemory(chat);
  if (!location || !location.longitude || !location.latitude)
    return "I don't know where you are, so I can't find any shopping centers near you.";

  const centers = await prisma.property.findMany({
    include: { spaces: true },
    where: {
      latitude: {
        gte: Number.parseFloat(location.latitude) - maxDistance / 69.172,
        lte: Number.parseFloat(location.latitude) + maxDistance / 69.172,
      },
      longitude: {
        gte: Number.parseFloat(location.longitude) - maxDistance / 57.393,
        lte: Number.parseFloat(location.longitude) + maxDistance / 57.393,
      },
    },
  });
  return propertiesToMarkdown({ centers, maxDistance });
}

async function locationFromWorkingMemory(
  chat: ChatGetPayload<{ include: { user: true } }>,
): Promise<{ longitude?: string; latitude?: string }> {
  const { location } = await getWorkingMemory(chat);
  return { longitude: location?.longitude, latitude: location?.latitude };
}

function propertiesToMarkdown({
  centers,
  maxDistance,
}: {
  centers: PropertyGetPayload<{ include: { spaces: true } }>[];
  maxDistance: number;
}): string {
  const prefix = `Here are the shopping centers in the area which are within ${maxDistance} miles of the user.
    These are all the shopping centers you know about.
    You do not know about any other shopping centers.
    If the user asks about a shopping center you do not know about, you should say so.
    Do not make up information about shopping centers you do not know about.
    Do not even mention shopping centers you do not know about.`;

  return `${prefix}\n\n${centers.map(propertyToMarkdown).join("\n\n")}`;
}

function propertyToMarkdown(
  center: PropertyGetPayload<{ include: { spaces: true } }>,
): string {
  return `<shopping-center>
  Shopping center name: ${center.name}
  Address: ${center.address}, ${center.city}, ${center.state}, ${center.country}
  Description: ${center.description}
  ${center.imageURLs.map((image) => `Image: ${image}`).join("\n")}
  Spaces: ${center.spaces.map(propertySpacesToMarkdown).join("\n")}
</shopping-center>`;
}

function propertySpacesToMarkdown(space: PropertySpace): string {
  return `<space>
  Space name: ${space.name}
  Description: ${space.details}
  Cost: ${space.cost}
  Foot traffic: ${space.footTraffic}
  Size: ${space.size} sqft
  Available: ${space.available}
  ${space.imageURLs.map((image) => `Image: ${image}`).join("\n")}
</space>`;
}

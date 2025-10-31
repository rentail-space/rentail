import { captureException } from "@sentry/react-router";
import type { PropertySpace, User } from "prisma/generated/client";
import type { PropertyGetPayload } from "prisma/generated/models";
import prisma from "~/lib/prisma";
import { cleanParse } from "./userProfile";

/**
 * Find the shopping centers within a given distance from the user. Gets the
 * current location from working memory, updates it, if necessary.
 *
 * @param user The user to find the shopping centers for.
 * @param maxDistance The distance in miles to find the shopping centers within.
 * @returns Markup with shopping centers and spaces based on distance
 */
export default async function findNearbyProperties({
  maxDistance,
  user,
}: {
  maxDistance: number;
  user: User;
}): Promise<{
  properties: PropertyGetPayload<{ include: { spaces: true } }>[];
  markdown: string;
}> {
  const { longitude, latitude } = await locationFromWorkingMemory(user);
  if (!longitude || !latitude) return { properties: [], markdown: "" };

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
  const markdown = centersToMarkdown({ properties, maxDistance });
  return { properties, markdown };
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

function centersToMarkdown({
  properties,
  maxDistance,
}: {
  properties: PropertyGetPayload<{ include: { spaces: true } }>[];
  maxDistance: number;
}): string {
  if (properties.length === 0)
    return "I don't know where you are, so I can't find any shopping centers near you.";

  const prefix = `Here are the shopping centers in the area which are within ${maxDistance} miles of the user.
    These are all the shopping centers you know about.
    You do not know about any other shopping centers.
    If the user asks about a shopping center you do not know about, you should say so.
    Do not make up information about shopping centers you do not know about.
    Do not even mention shopping centers you do not know about.`;

  return `${prefix}\n\n${properties.map(centerToMarkdown).join("\n\n")}`;
}

function centerToMarkdown(
  property: PropertyGetPayload<{ include: { spaces: true } }>,
): string {
  return `<shopping-center>
  Shopping center name: ${property.name}
  Address: ${property.address}, ${property.city}, ${property.state}, ${property.country}
  Description: ${property.description}
  ${property.imageURLs.map((image) => `Image: ${image}`).join("\n")}
  Spaces: ${property.spaces.map(centerSpacesToMarkdown).join("\n")}
</shopping-center>`;
}

function centerSpacesToMarkdown(space: PropertySpace): string {
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

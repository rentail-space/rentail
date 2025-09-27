import type { Chat, ShoppingCenterSpace, User } from "prisma/generated/client";
import type { ShoppingCenterGetPayload } from "prisma/generated/models";
import prisma from "~/lib/prisma";
import { updateWorkingMemory } from "~/lib/workingMemory";

/**
 * Find the shopping centers within a given distance from the user. Gets the
 * current location from working memory, updates it, if necessary.
 *
 * @param chat The chat to find the shopping centers for.
 * @param distance The distance in miles to find the shopping centers within.
 * @param user The user to find the shopping centers for.
 * @returns Markup with shopping centers and spaces based on distance
 */
export default async function findNearbySpaces({
  chat,
  distance,
  user,
}: {
  chat: Chat;
  distance: number;
  user: User;
}): Promise<string> {
  const location = await locationFromWorkingMemory(user, chat);
  if (!location || !location.longitude || !location.latitude)
    return "I don't know where you are, so I can't find any shopping centers near you.";

  const maxDistance = distance * 1609.344; // 20 miles in meters
  const nearBy = await prisma.$queryRaw<
    { id: string; longitude: number; latitude: number }[]
  >`
    SELECT id, ST_X(location::geometry), ST_Y(location::geometry)
    FROM "shopping_centers" 
    WHERE ST_DistanceSphere(location::geometry, ST_MakePoint(${location.longitude}, ${location.latitude})) < ${maxDistance}
  `;
  const centers = await prisma.shoppingCenter.findMany({
    include: { spaces: true },
    where: { id: { in: nearBy.map((center) => center.id) } },
  });
  return shoppingCentersToMarkdown(centers, maxDistance);
}

async function locationFromWorkingMemory(
  user: User,
  chat: Chat,
): Promise<{ longitude?: string; latitude?: string }> {
  const { location } = await updateWorkingMemory(user, chat);
  return { longitude: location?.longitude, latitude: location?.latitude };
}

function shoppingCentersToMarkdown(
  centers: ShoppingCenterGetPayload<{ include: { spaces: true } }>[],
  maxDistance: number,
): string {
  const prefix = `Here are the shopping centers in the area which are within ${maxDistance} miles of the user.
    These are all the shopping centers you know about.
    You do not know about any other shopping centers.
    If the user asks about a shopping center you do not know about, you should say so.
    Do not make up information about shopping centers you do not know about.
    Do not even mention shopping centers you do not know about.`;

  return `${prefix}\n\n${centers.map(shoppingCenterToMarkdown).join("\n\n")}`;
}

function shoppingCenterToMarkdown(
  center: ShoppingCenterGetPayload<{ include: { spaces: true } }>,
): string {
  return `<shopping-center>
  Shopping center name: ${center.name}
  Address: ${center.address}, ${center.city}, ${center.state}, ${center.country}
  Description: ${center.description}
  ${center.imageURLs.map((image) => `Image: ${image}`).join("\n")}
  Spaces: ${center.spaces.map(shoppingCenterSpacesToMarkdown).join("\n")}
</shopping-center>`;
}

function shoppingCenterSpacesToMarkdown(space: ShoppingCenterSpace): string {
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

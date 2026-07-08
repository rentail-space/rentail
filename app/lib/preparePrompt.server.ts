import type { User } from "prisma/generated";
import type { PropertyGetPayload } from "prisma/generated/models";
import {
  cleanParseWorkingMemory,
  workingMemoryExample,
} from "~/lib/workingMemory";
import chatPrompt from "~/prompts/chatPrompt.md?raw";
import generalDirectives from "~/prompts/generalDirectives.md?raw";
import envVars from "./env";
import findNearbyCenters from "./findNearbyCenters.server";
import prisma from "./prisma.server";
import timeOfDay from "./timeOfDay";

/**
 * Prepare the prompt by replacing the placeholders with the actual values.
 * This is used during live conversation and for sending alerts to users.
 *
 * @param prompt - The prompt to prepare.
 * @param headers - The HTTP headers to use to get the user's location.
 * @param user - The user to prepare the prompt for.
 * @returns The prepared prompt.
 * @throws An error if there's a mismatched $[tag] in the prompt.
 */
export default async function preparePrompt({
  headers,
  user,
}: {
  headers: Headers;
  user: User;
}): Promise<string> {
  const allCenters = await prisma.property.findMany({
    include: { spaces: true, state: true },
  });
  const maxDistance = 30; // miles
  const { centers: nearbyCenters, displayName } = await findNearbyCenters({
    headers,
    limit: 5,
    maxDistance,
    user,
  });
  // Use fixed date/time in test mode for consistent LLM caching
  const [date, time] = envVars.isTest
    ? ["2026-01-15", "12:00:00.000Z"]
    : new Date().toISOString().split("T");
  const workingMemory = cleanParseWorkingMemory(user?.workingMemory);
  return chatPrompt
    .replace("$[date]", date)
    .replace("$[time]", time)
    .replace(
      "$[location]",
      displayName
        ? `The user is in ${displayName}`
        : "Ask the user where are they looking for?",
    )
    .replace("$[name]", user.name || "not known")
    .replace("$[workingMemory]", JSON.stringify(workingMemory, null, 2))
    .replace(
      "$[workingMemorySchema]",
      JSON.stringify(workingMemoryExample, null, 2),
    )
    .replace(
      "$[nearbyCenters]",
      nearbyCenters.length === 0
        ? "I can't find any shopping centers near the user."
        : nearbyCenters.map(centerToJSON).join("\n\n"),
    )
    .replace(
      "$[allCenters]",
      allCenters
        .map(
          (center) =>
            `- [${center.name}](https://rentail.space/center/${center.id}) in ${center.city}, ${center.state.abbreviation}, ${center.state.country}`,
        )
        .join("\n"),
    )
    .replace("$[generalDirectives]", generalDirectives)
    .replace(/\$\[\w+\]/gm, (_match: string) => {
      throw new Error(`Section ${_match} not expanded`);
    });
}

function centerToJSON(
  center: PropertyGetPayload<{ include: { spaces: true; state: true } }>,
): string {
  const open =
    center.openFrom === 0 && center.openUntil === 2400
      ? { open24Hours: true }
      : center.openFrom && center.openUntil
        ? {
            openFrom: timeOfDay(center.openFrom),
            openUntil: timeOfDay(center.openUntil),
          }
        : null;
  const spaces = center.spaces.map((space) => ({
    number: space.number,
    type: space.type,
    size: space.size ?? "Unknown",
    floor: space.floor ?? "Unknown",
  }));

  return JSON.stringify(
    {
      ...open,
      address: center.address,
      centerType: center.centerType,
      city: center.city,
      country: center.state.country,
      demographics: center.demographics ?? "Unknown",
      description: center.description,
      googleMapsURL: `https://maps.google.com/?q=${encodeURIComponent(center.name)}`,
      name: center.name,
      numberOfStores: center.numberOfStores ?? "Unknown",
      phone: center.phone ?? null,
      ranking: center.ranking ?? "Unknown",
      rating: center.rating ?? "Unknown",
      reviewCount: center.reviewCount ?? "Unknown",
      spaces,
      squareFootage: center.squareFootage ?? "Unknown",
      state: center.state.abbreviation,
      url: `https://rentail.space/center/${center.id}`,
      website: center.website,
    },
    null,
    2,
  );
}

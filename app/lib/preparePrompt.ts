import type { User } from "prisma/generated/client";
import type { PropertyGetPayload } from "prisma/generated/models";
import {
  cleanParseWorkingMemory,
  workingMemoryExample,
} from "~/lib/workingMemory";
import chatPrompt from "~/prompts/chatPrompt.md?raw";
import generalDirectives from "~/prompts/generalDirectives.md?raw";
import envVars from "./env";
import externalLink from "./externalLink";
import findNearbyCenters from "./findNearbyCenters";
import prisma from "./prisma";

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
    select: { name: true, city: true, state: true, country: true },
  });
  const maxDistance = 30; // miles
  const { centers: nearbyCenters, displayName } = await findNearbyCenters({
    headers,
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
            `- ${center.name} in ${center.city}, ${center.state}, ${center.country}`,
        )
        .join("\n"),
    )
    .replace("$[generalDirectives]", generalDirectives)
    .replace(/\$\[\w+\]/gm, (_match) => {
      throw new Error(`Section ${_match} not expanded`);
    });
}

function centerToJSON(
  center: PropertyGetPayload<{ include: { spaces: true } }>,
): string {
  return JSON.stringify(
    {
      address: center.address,
      city: center.city,
      country: center.country,
      description: center.description,
      demographics: center.demographics ?? "Unknown",
      name: center.name,
      state: center.state,
      websiteURL: externalLink(center.website),
      centerURL: `https://rentail.space/center/${encodeURIComponent(
        center.id,
      )}`,
      googleMapsURL: `https://maps.google.com/?q=${encodeURIComponent(center.name)}`,
      spaces: center.spaces.map((space) => ({
        number: space.number,
        type: space.type,
        size: space.size ?? "Unknown",
        floor: space.floor ?? "Unknown",
      })),
    },
    null,
    2,
  );
}

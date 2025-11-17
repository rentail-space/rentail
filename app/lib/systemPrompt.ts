import type { PropertySpace, User } from "prisma/generated/client";
import type { PropertyGetPayload } from "prisma/generated/models";
import { userProfile, zodToExample } from "~/lib/userProfile";
import source from "~/prompts/systemPrompt.md?raw";
import findNearbyCenters from "./findNearbyCenters";

/**
 * Get the system prompt for the chat.
 *
 * @param headers - The HTTP headers to use to get the user's location.
 * @param user - The user to find the shopping centers for. If not provided, the
 * location will be inferred from the IP address in the headers.
 * @returns The system prompt with the shopping centers included.
 */
export default async function systemPrompt({
  headers,
  user,
}: {
  headers: Headers;
  user?: User;
}): Promise<string> {
  const centers = await findNearbyCenters({ headers, user });
  const [date, time] = new Date().toISOString().split("T");
  const prompt = source
    .replace("$[date]", date)
    .replace("$[time]", time)
    .replace(
      "$[userProfile]",
      JSON.stringify(zodToExample(userProfile), null, 2),
    )
    .replace("$[centers]", centersToMarkdown({ centers, maxDistance: 20 }));
  return prompt;
}

function centersToMarkdown({
  centers,
  maxDistance,
}: {
  centers: PropertyGetPayload<{ include: { spaces: true } }>[];
  maxDistance: number;
}): string {
  if (centers.length === 0)
    return "I don't know where you are, so I can't find any shopping centers near you.";

  const prefix = `Here are the shopping centers in the area which are within ${maxDistance} miles of the user.
    These are all the shopping centers you know about.
    You do not know about any other shopping centers.
    If the user asks about a shopping center you do not know about, you should say so.
    Do not make up information about shopping centers you do not know about.
    Do not even mention shopping centers you do not know about.`;

  return `${prefix}\n\n${centers.map(centerToMarkdown).join("\n\n")}`;
}

function centerToMarkdown(
  center: PropertyGetPayload<{ include: { spaces: true } }>,
): string {
  const xml = toXml({
    name: center.name,
    address: center.address,
    city: center.city,
    state: center.state,
    country: center.country,
    website: center.website,
    description: center.description,
  });
  return [
    "<shopping-center>",
    xml,
    demographics(center.demographics),
    spaces(center.spaces),
    "</shopping-center>",
  ]
    .filter(Boolean)
    .join("\n");
}

function demographics(demographics: string | null): string {
  return demographics ? `<demographics>\n${demographics}\n</demographics>` : "";
}

function spaces(spaces: PropertySpace[]): string {
  return spaces
    .map((space) =>
      toXml({
        number: space.number,
        type: space.type,
        size: space.size,
        floor: space.floor,
      }),
    )
    .map((space) => `<space>\n${space}\n</space>`)
    .join("\n");
}

function toXml(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .map(([key, value]) => {
      if (Array.isArray(value))
        return value.map((item) => `  ${toLabel(key)}: ${item}`).join("\n");
      return `  ${toLabel(key)}: ${value}`;
    })
    .join("\n");
}

function toLabel(key: string): string {
  return key
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2") // Handle acronyms: "URLSet" -> "URL Set"
    .replace(/([a-z])([A-Z])/g, "$1 $2") // CamelCase: "footTraffic" -> "foot Traffic"
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first
    .trim();
}

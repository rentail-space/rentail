import type { PropertySpace, User } from "prisma/generated/client";
import type { PropertyGetPayload } from "prisma/generated/models";
import {
  cleanParseWorkingMemory,
  workingMemoryExample,
} from "~/lib/workingMemory";
import generalDirectives from "~/prompts/generalDirectives.md?raw";
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
  prompt,
  headers,
  user,
}: {
  prompt: string;
  headers: Headers;
  user: User;
}): Promise<string> {
  const allCenters = await prisma.property.findMany({
    select: { name: true, city: true, state: true, country: true },
  });
  const { centers: nearbyCenters, location } = await findNearbyCenters({
    headers,
    user,
  });
  const [date, time] = new Date().toISOString().split("T");
  const workingMemory = cleanParseWorkingMemory(user?.workingMemory);
  return prompt
    .replace("$[date]", date)
    .replace("$[time]", time)
    .replace("$[location]", location)
    .replace("$[name]", user.name || "not known")
    .replace("$[workingMemory]", JSON.stringify(workingMemory, null, 2))
    .replace(
      "$[workingMemorySchema]",
      JSON.stringify(workingMemoryExample, null, 2),
    )
    .replace(
      "$[nearbyCenters]",
      centersToMarkdown({ centers: nearbyCenters, maxDistance: 20 }),
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
  const description =
    process.env.NODE_ENV === "test"
      ? center.description.split("\n")[0]
      : center.description;
  const xml = toXml({
    address: center.address,
    city: center.city,
    country: center.country,
    description,
    name: center.name,
    state: center.state,
    website: center.website,
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

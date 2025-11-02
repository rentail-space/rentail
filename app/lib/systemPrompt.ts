import type { PropertyGetPayload } from "prisma/generated/models";
import type { ZodType } from "zod";
import source from "~/prompts/systemPrompt.md?raw";
import { zodToExample } from "./userProfile";

export default function systemPrompt({
  userProfile,
  properties,
}: {
  userProfile: ZodType;
  properties: PropertyGetPayload<{ include: { spaces: true } }>[];
}): string {
  const [date, time] = new Date().toISOString().split("T");
  const prompt = source
    .replace("$[date]", date)
    .replace("$[time]", time)
    .replace(
      "$[userProfile]",
      JSON.stringify(zodToExample(userProfile), null, 2),
    )
    .replace(
      "$[properties]",
      centersToMarkdown({ properties, maxDistance: 20 }),
    );
  return prompt;
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
  return toXml({
    obj: {
      ...property,
      spaces: property.spaces.map((space) =>
        toXml({ obj: space, tag: "space" }),
      ),
    },
    tag: "shopping-center",
  });
}

function toXml({
  obj,
  tag,
}: {
  obj: Record<string, unknown>;
  tag: string;
}): string {
  const entries = Object.entries(obj)
    .map(([key, value]) => {
      if (Array.isArray(value))
        return value.map((item) => `  ${toLabel(key)}: ${item}`).join("\n");
      return `  ${toLabel(key)}: ${value}`;
    })
    .join("\n");

  return `<${tag}>\n${entries}\n</${tag}>`;
}

function toLabel(key: string): string {
  return key
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2") // Handle acronyms: "URLSet" -> "URL Set"
    .replace(/([a-z])([A-Z])/g, "$1 $2") // CamelCase: "footTraffic" -> "foot Traffic"
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first
    .trim();
}

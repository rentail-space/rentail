import type { PropertySpace } from "prisma/generated/client";
import type { PropertyGetPayload } from "prisma/generated/models";
import type { ZodType } from "zod";
import general from "~/prompts/general.md?raw";
import { zodToExample } from "./userProfile";

export default function prompt({
  userProfile,
  properties,
}: {
  userProfile: ZodType;
  properties: PropertyGetPayload<{ include: { spaces: true } }>[];
}): string {
  const [date, time] = new Date().toISOString().split("T");
  const prompt = general
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
  console.log(prompt);
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

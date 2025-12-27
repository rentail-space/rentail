import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { invariant } from "es-toolkit";
import { ulid } from "ulid";
import zod from "zod";
import { geocodeFromUserInput } from "./geocode";
import prisma from "./prisma";

const outputSchema = zod.object({
  centers: zod.array(
    zod.object({
      name: zod.string().describe("The shopping center's name"),
      address: zod.string().describe("The shopping center's full address"),
      summary: zod.string().describe("The shopping center's summary"),
      website: zod.string().describe("The shopping center's website"),
    }),
  ),
});

const mcpServer = new McpServer({
  description:
    "The comprehensive marketplace for specialty leasing and short-term retail spaces in US shopping centers. Find kiosks, pop-up shops, carts, and temporary retail locations nationwide.",
  icons: [
    {
      src: "https://rentail.space/images/logo.png",
      mimeType: "image/png",
      sizes: ["192x192", "512x512"],
    },
  ],
  name: "rentail",
  title: "Rentail.space",
  version: "1.0.0",
  websiteUrl: "https://rentail.space",
});

mcpServer.registerTool(
  "list_shopping_centers",
  {
    title: "List Shopping Centers",
    description:
      "List all shopping centers in a given city, state, and country",
    inputSchema: zod.object({
      location: zod.string().describe("The merchant's location"),
    }),
    outputSchema,
  },
  async (params, _extra) => {
    const geocode = await geocodeFromUserInput(params.location);
    if (!geocode) throw new Error("I do not have your location");

    const maxDistance = 30; // miles
    const centers = await prisma.property.findMany({
      include: {
        spaces: {
          where: { available: true },
        },
      },
      where: {
        latitude: {
          gte: geocode.latitude - maxDistance / 69.172,
          lte: geocode.latitude + maxDistance / 69.172,
        },
        longitude: {
          gte: geocode.longitude - maxDistance / 57.393,
          lte: geocode.longitude + maxDistance / 57.393,
        },
      },
    });

    const output = {
      centers: centers.map((center) => ({
        address: [center.address, center.city, center.state, center.country]
          .filter(Boolean)
          .join(", "),
        name: center.name,
        summary: center.summary,
        website: center.website,
      })),
    } as zod.infer<typeof outputSchema>;
    invariant(outputSchema.parse(output), "Output does not match schema");
    return {
      content: [{ type: "text", text: JSON.stringify(output) }],
      structuredContent: output,
    };
  },
);

const transport = new WebStandardStreamableHTTPServerTransport({
  sessionIdGenerator: () => ulid(),
});
mcpServer.connect(transport);

export default transport;

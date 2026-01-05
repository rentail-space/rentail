import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { invariant } from "es-toolkit";
import type { User } from "prisma/generated/client";
import { ulid } from "ulid";
import zod from "zod";
import externalLink from "../externalLink";
import { geocodeFromUserInput } from "../geocode";
import prisma from "../prisma";

const listCentersSpec = {
  annotations: { readOnlyHint: true },
  description:
    "List all shopping centers and enclosed malls in a given city or area. Focus on retail shopping centers, strip malls, and enclosed malls. Exclude individual stores or single-building retail. Helps the user find a space to rent in a shopping center or mall.",
  inputSchema: zod.object({
    location: zod
      .string()
      .describe("The location to search for shopping centers and malls")
      .optional(),
  }),
  outputSchema: zod.object({
    centers: zod.array(
      zod.object({
        address: zod.string().describe("Full address"),
        name: zod.string().describe("The shopping center or mall's name"),
        numberOfStores: zod
          .int()
          .positive()
          .optional()
          .describe("Number of stores"),
        rating: zod.int().positive().optional().describe("Rating (1-5)"),
        squareFootage: zod
          .int()
          .positive()
          .optional()
          .describe("Square footage"),
        summary: zod.string().describe("Summary description"),
        website: zod.string().describe("Website URL"),
      }),
    ),
  }),
  title: "List shopping centers",
  _meta: {
    "openai/toolInvocation/invoking": "Searching for shopping centers …",
    "openai/toolInvocation/invoked": "Found shopping centers",
  },
};

/**
 * Register the `list_shopping_centers` tool with the MCP server.
 *
 * @param mcpServer - The MCP server instance.
 */
export default function registerListCenters(mcpServer: McpServer) {
  mcpServer.registerTool(
    "list_shopping_centers",
    listCentersSpec,
    async (params, { _meta, ...extra }) => {
      const userId =
        _meta?.["openai/subject"]?.toString() || extra.sessionId || ulid();
      const location =
        _meta?.["openai/userLocation"]?.toString() || params.location || "";

      const geocode = await geocodeFromUserInput(location);
      if (!geocode) throw new Error("I do not have your location");

      await getUserForSession({
        location: geocode,
        userAgent: _meta?.["openai/userAgent"]?.toString() || "N/A",
        userId,
      });

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
          numberOfStores: center.numberOfStores,
          rating: center.rating,
          squareFootage: center.squareFootage,
          summary: center.summary,
          website: externalLink(center.website),
        })),
      } as zod.infer<typeof listCentersSpec.outputSchema>;
      invariant(
        listCentersSpec.outputSchema.parse(output),
        "Output does not match schema",
      );
      return {
        content: [{ type: "text", text: JSON.stringify(output) }],
        structuredContent: output,
        _meta: {
          centersByName: Object.fromEntries(
            centers.map((center) => [center.name, center]),
          ),
        },
      };
    },
  );
}

async function getUserForSession({
  location,
  userAgent,
  userId,
}: {
  location: {
    displayName: string;
    latitude: number;
    longitude: number;
  };
  userAgent: string;
  userId: string;
}): Promise<User> {
  const id = `mcp-${userId}`;
  return (
    (await prisma.user.findUnique({ where: { id } })) ??
    (await prisma.user.create({
      data: {
        email: `mcp-${id}@rentail.space`,
        geocode: JSON.stringify({ location }),
        id,
        isAnonymous: true,
        isMCP: true,
        metadata: {},
        userAgent,
        workingMemory: JSON.stringify({ location }),
      },
    }))
  );
}

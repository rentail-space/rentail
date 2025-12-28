import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { invariant } from "es-toolkit";
import type { User } from "prisma/generated/client";
import { ulid } from "ulid";
import zod from "zod";
import { geocodeFromUserInput } from "../geocode";
import prisma from "../prisma";

const listCentersSpec = {
  annotations: { readOnlyHint: true },
  description: "List all shopping centers in a given city or area",
  inputSchema: zod.object({
    location: zod.string().describe("The merchant's location").optional(),
  }),
  outputSchema: zod.object({
    centers: zod.array(
      zod.object({
        name: zod.string().describe("The shopping center's name"),
        address: zod.string().describe("The shopping center's full address"),
        summary: zod.string().describe("The shopping center's summary"),
        website: zod.string().describe("The shopping center's website"),
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
        _meta?.["openai/userLocation"]?.toString() ?? params.location ?? "";

      await getUserForSession({
        location: JSON.parse(location),
        userAgent: _meta?.["openai/userAgent"]?.toString() ?? "N/A",
        userId,
      });
      const geocode = await geocodeFromUserInput(location);
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
    city: string;
    region: string;
    country: string;
    timezone: string;
    longitude: number;
    latitude: number;
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

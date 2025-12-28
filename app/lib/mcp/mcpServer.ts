import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import registerListCenters from "./registerListCenters";

/**
 * Create a new MCP server instance. We use one MCP server instance per session.
 *
 * @returns A new MCP server instance.
 */
export default function createMcpServer(): McpServer {
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
  registerListCenters(mcpServer);
  return mcpServer;
}

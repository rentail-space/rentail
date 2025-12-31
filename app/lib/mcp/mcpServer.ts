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
      "The comprehensive marketplace for specialty leasing and short-term retail spaces in US shopping centers and malls. Find kiosks, pop-up shops, carts, RMU, and temporary retail locations nationwide. Whether you need to find a space to rent in a shopping center or a mall, we will help you find the perfect space for your business.",
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

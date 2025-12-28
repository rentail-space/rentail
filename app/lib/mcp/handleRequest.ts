import { InMemoryEventStore } from "@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { ulid } from "ulid";
import createMcpServer from "./mcpServer";

/**
 * GET and POST requests share similar handlers: create the MCP server and
 * transport, and delegate to the transport to handle the request. This method
 * is fairly complicated because we need to maintain streamable HTTP transports
 * across multiple requests in the same session.
 */
export default async function handleRequest(
  request: Request,
): Promise<Response> {
  const sessionId = request.headers.get("mcp-session-id");

  if (request.method === "DELETE") {
    if (sessionId) transports.delete(sessionId);
    return new Response(null, { status: 204 });
  }

  if (request.method === "GET" || request.method === "POST") {
    if (sessionId) {
      const transport = transports.get(sessionId);
      if (!transport) throw new Response("Not Found", { status: 404 });
      return await transport.handleRequest(request);
    }

    const server = createMcpServer();
    const eventStore = new InMemoryEventStore();
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: () => ulid(),
      eventStore, // Enable resumability
      onsessioninitialized: (sessionId: string) => {
        // Store the transport by session ID when a session is initialized. This
        // avoids race conditions where requests might come in before the
        // session is stored.
        transports.set(sessionId, transport);
      },
    });
    server.server.onclose = async () => {
      if (transport.sessionId) transports.delete(transport.sessionId);
    };
    await server.connect(transport);
    return await transport.handleRequest(request);
  }

  throw new Response("Method Not Allowed", { status: 405 });
}

/**
 * Hold the active MCP transports by session ID. This is necessary since a given
 * client would make several HTTP requests to the MCP server, and it gets
 * confused if we use different transports for each request.
 */
const transports = new Map<string, WebStandardStreamableHTTPServerTransport>();

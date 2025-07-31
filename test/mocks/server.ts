import { setupServer } from "msw/node";
import config from "~/lib/config";
import { handlers } from "./handlers";

// Setup MSW server with our handlers
export const server = setupServer(...handlers);

if (config.isDebug)
  server.events.on("response:mocked", ({ request, response }) =>
    console.debug(
      "MSW: %s %s => %s",
      request.method,
      request.url,
      response.status,
    ),
  );

server.events.on("request:unhandled", ({ request }) =>
  console.error("MSW: Unhandled request: %s %s", request.method, request.url),
);

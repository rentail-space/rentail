import { setupServer } from "msw/node";
import config from "~/lib/config";
import { handlers } from "./handlers";

const server = config.isTest ? setupServer(...handlers) : undefined;
export default server;

// Add logging for debugging
if (server && config.isDebug) {
  server.events.on("request:start", ({ request }) =>
    console.debug("[MSW] %s", request.method, request.url),
  );
  server.events.on("response:mocked", ({ request, response }) => {
    console.debug(
      "[MSW] %s %s => %s",
      request.method,
      request.url,
      response.status,
    );
  });
}

if (server) {
  server.events.on("request:unhandled", ({ request }) => {
    // Only log external requests that are being bypassed
    const url = new URL(request.url);
    if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
      console.debug(
        "[MSW Server] Unhandled external request (bypassed): %s %s",
        request.method,
        request.url,
      );
    }
  });

  server.events.on("unhandledException", ({ request, error }) =>
    console.error("[MSW] %s %s errored!", request.method, request.url, error),
  );
}

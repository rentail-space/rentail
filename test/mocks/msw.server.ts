import debug from "debug";
import { setupServer } from "msw/node";
import { handlers } from "~/test/mocks/msw.handlers";

const server = setupServer(...handlers);
const logging = debug("msw").enabled;

// Add logging for debugging
if (logging) {
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
}

server.events.on("unhandledException", ({ request, error }) =>
  console.error("[MSW] %s %s errored!", request.method, request.url, error),
);

export default server;

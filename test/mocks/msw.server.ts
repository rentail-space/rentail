import debug from "debug";
import { setupServer } from "msw/node";
import { handlers } from "~/test/mocks/msw.handlers";

const server = setupServer(...handlers);
const log = debug("msw");

// Add logging for debugging
server.events.on("request:start", ({ request }) =>
  log("%s", request.method, request.url),
);

server.events.on("response:mocked", ({ request, response }) => {
  log("%s %s => %s", request.method, request.url, response.status);
});

server.events.on("request:unhandled", ({ request }) => {
  // Only log external requests that are being bypassed
  const url = new URL(request.url);
  if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    log(
      "Unhandled external request (bypassed): %s %s",
      request.method,
      request.url,
    );
  }
});

server.events.on("unhandledException", ({ request, error }) =>
  log("%s %s errored!", request.method, request.url, error),
);

export default server;

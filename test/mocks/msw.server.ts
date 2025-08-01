import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll } from "vitest";
import config from "~/lib/config";
import { handlers } from "./handlers";

const server = setupServer(...handlers);
server.listen({ onUnhandledRequest: "error" });

// Add logging for debugging
if (config.isDebug) {
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

// Start MSW server before all tests
beforeAll(() =>
  server.listen({
    onUnhandledRequest: "error",
  }),
);

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close MSW server after all tests
afterAll(() => server.close());

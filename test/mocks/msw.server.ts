import debug from "debug";
import { setupServer } from "msw/node";
import { handlers } from "~/test/mocks/msw.handlers";

const msw = setupServer(...handlers);

// Add logging for debugging
msw.events.on("request:start", ({ request }) =>
  debug("msw")("%s", request.method, request.url),
);

msw.events.on("response:mocked", ({ request, response }) => {
  debug("msw")("%s %s => %s", request.method, request.url, response.status);
});

msw.events.on("request:unhandled", ({ request }) => {
  // Only log external requests that are being bypassed
  const url = new URL(request.url);
  if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    debug("msw")(
      "Unhandled external request (bypassed): %s %s",
      request.method,
      request.url,
    );
  }
});

msw.events.on("unhandledException", ({ request, error }) =>
  debug("msw")("%s %s errored!", request.method, request.url, error),
);

export default msw;

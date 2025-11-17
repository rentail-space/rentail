import debug from "debug";
import { http, HttpResponse, passthrough } from "msw";
import { setupServer } from "msw/node";
import { ulid } from "ulid";
import { findMockResponse } from "./mockAnthropic";

const handlers = [
  // Mock Anthropic API
  http.post(
    "https://api.anthropic.com/v1/messages",
    async ({ request }: { request: Request }) => {
      try {
        const json = await request.json();
        const stream = findMockResponse(json);
        return new HttpResponse(stream, {
          headers: { "Content-Type": "text/event-stream" },
        });
      } catch (error) {
        debug("msw")("Error in Anthropic API mock: %s", error);
        return HttpResponse.error();
      }
    },
  ),

  // Make sure we're not sending emails in tests
  http.post("https://api.resend.com/emails", () =>
    HttpResponse.json({ id: ulid() }),
  ),

  // Mock OpenStreetMap Nominatim API
  http.get("https://nominatim.openstreetmap.org/search", ({ request }) =>
    HttpResponse.json(
      [
        {
          place_id: ulid(),
          display_name:
            new URL(request.url).searchParams.get("q") ??
            "Los Angeles, California, United States",
          lat: "33.74901",
          lon: "-118.1956",
        },
      ],
      { headers: { "Content-Type": "application/json" } },
    ),
  ),

  // Allow all localhost requests to pass through (for dev server communication)
  http.all(
    ({ request }: { request: Request }) =>
      new URL(request.url).hostname === "localhost",
    () => passthrough(), // Pass through to real server
  ),

  // Allow images, fonts, and other assets to fail gracefully
  http.get(
    /\.(jpg|jpeg|png|gif|webp|woff|woff2|ttf|svg|css|ico|eot)(\?.*)?$/i,
    () => new HttpResponse(null, { status: 204 }), // No content
  ),

  // Block any other external HTTP services not explicitly mocked
  http.all(
    () => true,
    ({ request }: { request: Request }) => {
      debug("msw")("Blocked %s request to: %s", request.method, request.url);
      return HttpResponse.json(
        { error: "External HTTP requests are not allowed in tests" },
        { status: 503 },
      );
    },
  ),
];

const msw = setupServer(...handlers);

// Add logging for debugging
msw.events
  .on("request:start", ({ request }) =>
    debug("msw")("%s", request.method, request.url),
  )
  .on("response:mocked", ({ request, response }) => {
    debug("msw")("%s %s => %s", request.method, request.url, response.status);
  })
  .on("request:unhandled", ({ request }) => {
    // Only log external requests that are being bypassed
    const url = new URL(request.url);
    if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
      debug("msw")(
        "Unhandled external request (bypassed): %s %s",
        request.method,
        request.url,
      );
    }
  })
  .on("unhandledException", ({ request, error }) => {
    debug("msw")("%s %s errored!", request.method, request.url, error);
  });

export default msw;

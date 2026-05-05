import debug from "debug";
import { HttpResponse, http, passthrough } from "msw";
import { setupServer } from "msw/node";
import { ulid } from "ulid";
import { findMockResponse } from "./mockDeepseek";

const logger = debug("msw");

const handlers = [
  // Mock DeepSeek API
  http.post(
    "https://api.deepseek.com/v1/responses",
    async ({ request }: { request: Request }) => {
      logger("DeepSeek API mock hit! URL: %s", request.url);
      try {
        const json = await request.json();
        logger("DeepSeek API mock request body: %j", json);
        const stream = findMockResponse(json);
        return new HttpResponse(stream, {
          headers: { "Content-Type": "text/event-stream" },
        });
      } catch (error) {
        logger("Error in DeepSeek API mock: %s", error);
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
    HttpResponse.json([
      {
        place_id: ulid(),
        display_name:
          new URL(request.url).searchParams.get("q") ??
          "Los Angeles, California, United States",
        lat: "33.74901",
        lon: "-118.1956",
      },
    ]),
  ),

  http.get("https://api.ipgeolocation.io/v2/timezone", () =>
    HttpResponse.json({ timezone: { name: "America/Los_Angeles" } }),
  ),

  http.get("https://api.ipgeolocation.io/v2/ipgeo", () =>
    HttpResponse.json({
      location: {
        city: "Los Angeles",
        country_code2: "US",
        latitude: "34.05361",
        longitude: "-118.24550",
        state_code: "US-CA",
      },
    }),
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
      logger("Blocked %s request to: %s", request.method, request.url);
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
    logger("Request: %s %s", request.method, request.url),
  )
  .on("response:mocked", ({ request, response }) => {
    logger("Mocked: %s %s => %s", request.method, request.url, response.status);
  })
  .on("request:unhandled", ({ request }) => {
    logger("Unhandled: %s %s", request.method, request.url);
  })
  .on("unhandledException", ({ request, error }) => {
    logger("Exception: %s %s %o", request.method, request.url, error);
  });

export default function listen() {
  msw.listen({
    onUnhandledRequest: "error",
  });
}

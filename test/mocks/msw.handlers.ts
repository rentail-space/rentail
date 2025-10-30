import debug from "debug";
import { HttpResponse, http, passthrough } from "msw";
import { ulid } from "ulid";
import { findMockResponse } from "./anthropic.stream";

export const handlers = [
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

  // Allow all localhost requests to pass through (for dev server communication)
  http.all(
    ({ request }: { request: Request }) =>
      new URL(request.url).hostname === "localhost",
    () => passthrough(), // Pass through to real server
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

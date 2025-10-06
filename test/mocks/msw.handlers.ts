import debug from "debug";
import { HttpResponse, http, passthrough } from "msw";
import { ulid } from "ulid";
import { findMockResponse } from "~/test/mocks/anthropic.mock";

export const handlers = [
  // Mock Anthropic API
  http.post(
    "https://api.anthropic.com/v1/messages",
    async ({ request }: { request: Request }) => {
      try {
        const body = (await request.json()) as Parameters<
          typeof findMockResponse
        >[0];
        return new HttpResponse(findMockResponse(body), {
          headers: { "Content-Type": "text/event-stream" },
        });
      } catch (error) {
        const logging = debug("msw").enabled;
        if (logging) console.error("[MSW] Error in Anthropic API mock:", error);
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
      const logging = debug("msw").enabled;
      if (logging)
        console.warn(
          `[MSW] Blocked ${request.method} request to: ${request.url}`,
        );
      return HttpResponse.json(
        { error: "External HTTP requests are not allowed in tests" },
        { status: 503 },
      );
    },
  ),
];

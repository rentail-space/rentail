import { invariant } from "es-toolkit";
import { HttpResponse, http } from "msw";
import { findMockResponse } from "~/test/mocks/anthropic.mock";

export const handlers = [
  // Mock Anthropic API
  http.post(
    "https://api.anthropic.com/v1/messages",
    async ({ request }: { request: Request }) => {
      console.log("**** request", await request.clone().text());
      try {
        const body = (await request.json()) as Parameters<
          typeof findMockResponse
        >[0];

        return new HttpResponse(findMockResponse(body), {
          headers: { "Content-Type": "text/event-stream" },
        });
      } catch (error) {
        console.error("[MSW] Error in Anthropic API mock:", error);
        return HttpResponse.error();
      }
    },
  ),

  http.get(
    "https://api.ipgeolocation.io/v2/timezone",
    async ({ request }: { request: Request }) => {
      const url = new URL(request.url);
      const ip = url.searchParams.get("ip");
      invariant(ip, "IP is required");
      if (ip === "146.70.195.182") {
        return HttpResponse.json({
          location: {
            country_name: "United States",
            state_prov: "California",
            city: "Los Angeles",
            zipcode: "90001",
            latitude: "37.42240",
            longitude: "-122.08421",
          },
          time_zone: {
            name: "America/Los_Angeles",
          },
        });
      } else return new HttpResponse({ status: 404 });
    },
  ),

  // Make sure we're not sending emails in tests
  http.post("https://api.resend.com/emails", () =>
    HttpResponse.json({ status: 200 }),
  ),

  // Allow all localhost requests to pass through (for dev server communication)
  http.all(/^https?:\/\/localhost:\d+/, () => {
    return; // Pass through to real server
  }),

  // Block any other external HTTP services not explicitly mocked
  http.all("https://*/*", ({ request }: { request: Request }) => {
    console.warn(`[MSW] Blocked ${request.method} request to: ${request.url}`);
    return HttpResponse.json(
      { error: "External HTTP requests are not allowed in tests" },
      { status: 503 },
    );
  }),
];

import type { Tool, ToolChoice } from "ai";
import { invariant, last } from "es-toolkit";
import { HttpResponse, http } from "msw";
import { findMockResponse } from "./anthropic.mock";
import createStreamingResponse from "./anthropic.stream";

export const handlers = [
  // Mock Anthropic API
  http.post("https://api.anthropic.com/v1/messages", async ({ request }) => {
    try {
      const body = (await request.json()) as {
        messages: Array<{
          role: string;
          content: Array<{ type: string; text: string }>;
        }>;
        tools: { name: string }[];
        tool_choice: { type: ToolChoice<Record<string, Tool>> };
      };

      console.log("\n\nbody %o\n\n", body);

      // Extract the last user message from the request
      const message = last(body.messages);
      invariant(
        message?.role === "user",
        "Last message must be a user message",
      );

      // Get the text content from the message
      const messageText = message.content
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join(" ");

      console.info(
        `[MSW] Anthropic API mock - processing message: "${messageText.slice(0, 100)}..."`,
      );

      const mockResponse = findMockResponse(messageText);
      return new HttpResponse(createStreamingResponse(mockResponse), {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } catch (error) {
      console.error("[MSW] Error in Anthropic API mock:", error);
      return HttpResponse.json(
        {
          type: "error",
          error: { type: "internal_server_error", message: "Mock API error" },
        },
        { status: 500 },
      );
    }
  }),

  http.get("https://api.ipgeolocation.io/v2/timezone", async ({ request }) => {
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
  }),

  // Allow all localhost requests to pass through (for dev server communication)
  http.all(/^https?:\/\/localhost:\d+/, () => {
    return; // Pass through to real server
  }),

  // Block any other external HTTP services not explicitly mocked
  http.all("https://*/*", ({ request }) => {
    // Skip the Anthropic API since we handle it above
    if (request.url.includes("api.anthropic.com")) {
      return;
    }

    console.warn(`[MSW] Blocked ${request.method} request to: ${request.url}`);
    return HttpResponse.json(
      { error: "External HTTP requests are not allowed in tests" },
      { status: 503 },
    );
  }),
];

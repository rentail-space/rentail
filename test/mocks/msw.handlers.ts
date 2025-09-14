import { last } from "es-toolkit";
import { HttpResponse, http } from "msw";
import invariant from "tiny-invariant";
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
      };

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

      console.log(
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

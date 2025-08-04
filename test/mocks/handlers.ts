import { HttpResponse, http } from "msw";

export const handlers = [
  // Mock Anthropic API
  http.post("https://api.anthropic.com/v1/messages", () => {
    return HttpResponse.json({
      id: "msg_test_123",
      type: "message",
      role: "assistant",
      content: [
        {
          type: "text",
          text: "This is a mocked response from Claude. I can help you find retail spaces for your business needs.",
        },
      ],
      model: "claude-4-opus-20250514",
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: {
        input_tokens: 10,
        output_tokens: 25,
      },
    });
  }),

  // Mock streaming endpoint if needed
  http.post("https://api.anthropic.com/v1/messages/stream", () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Mock streaming response chunks
        controller.enqueue(
          encoder.encode(
            `data: {"type":"message_start","message":{"id":"msg_test_123","type":"message","role":"assistant","content":[],"model":"claude-4-opus-20250514","stop_reason":null,"stop_sequence":null,"usage":{"input_tokens":10,"output_tokens":0}}}\n\n`,
          ),
        );
        controller.enqueue(
          encoder.encode(
            `data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}\n\n`,
          ),
        );
        controller.enqueue(
          encoder.encode(
            `data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"This is a mocked streaming response from Claude. I can help you find retail spaces."}}\n\n`,
          ),
        );
        controller.enqueue(
          encoder.encode(`data: {"type":"content_block_stop","index":0}\n\n`),
        );
        controller.enqueue(
          encoder.encode(
            `data: {"type":"message_delta","delta":{"stop_reason":"end_turn","stop_sequence":null},"usage":{"output_tokens":15}}\n\n`,
          ),
        );
        controller.enqueue(encoder.encode(`data: {"type":"message_stop"}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new HttpResponse(stream, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }),

  // Block any other external HTTP services not explicitly mocked
  http.get("https://*/*", ({ request }) => {
    console.warn(`[MSW] Blocked external HTTP GET request to: ${request.url}`);
    return HttpResponse.json(
      { error: "External HTTP requests are not allowed in tests" },
      { status: 503 },
    );
  }),

  http.post("https://*/*", ({ request }) => {
    // Skip if already handled by specific handlers above
    const url = new URL(request.url);
    if (url.hostname === "api.anthropic.com") {
      return; // Let the specific Anthropic handlers handle this
    }

    console.warn(`[MSW] Blocked external HTTP POST request to: ${request.url}`);
    return HttpResponse.json(
      { error: "External HTTP requests are not allowed in tests" },
      { status: 503 },
    );
  }),

  // Allow all localhost requests to pass through (for dev server communication)
  http.get(/^https?:\/\/localhost:\d+/, () => {
    return; // Pass through to real server
  }),
];

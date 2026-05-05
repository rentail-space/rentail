/**
 * DeepSeek API Streaming Response Handler
 *
 * OpenAI Responses API format (used by AI SDK with createOpenAI)
 */

import { last } from "radashi";
import { ulid } from "ulid";
import debug from "debug";

const logger = debug("msw");

/**
 * Custom mock responses for specific test scenarios
 */
const customMockResponses = {
  "clothing boutique":
    "Perfect! I found some great locations for your clothing boutique. Here are the top options with excellent foot traffic.",

  "locations available":
    "We have some great locations available. Here are the top options with excellent foot traffic.",

  "looking for a pop-up retail space for my clothing boutique":
    "Perfect! I found some great locations for your clothing boutique. Here are the top options with excellent foot traffic.",

  "retail spaces":
    "Great! I'd be happy to help you find retail spaces. What type of business are you looking to set up?",

  "Actually I'm in Boston": `Thanks for letting me know. I'll update my working memory.
    <working_memory>{
      location: {
        city: "Boston",
        state: "Massachusetts",
        country: "United States",
        latitude: 42.3601,
        longitude: -71.0589,
        timeZone: "America/New_York"
      }
    }
    </working_memory>`,
};

/**
 * Default fallback response when no patterns match
 */
const fallbackResponse: string = "Fallback response!";

/**
 * Find a matching response for the given message
 */
export function findMockResponse(body: object): ReadableStream<Uint8Array> {
  const { input } = body as {
    input?:
      | string
      | Array<{
          role?: string;
          type?: string;
          text?: string;
          content?: string | Array<{ type: string; text?: string }>;
        }>;
  };

  // Extract the LAST user message text for pattern matching
  let messageText = "";
  if (typeof input === "string") {
    messageText = input;
  } else if (Array.isArray(input)) {
    // Find the last user message
    const userMessages = input.filter(
      (item) => item.role === "user" && Array.isArray(item.content),
    );
    const lastUserMessage = last(userMessages);
    if (lastUserMessage && Array.isArray(lastUserMessage.content)) {
      messageText = lastUserMessage.content
        .filter((c) => c.type === "input_text")
        .map((c) => c.text || "")
        .join(" ");
    }
  }

  logger(
    "DeepSeek API mock - processing message: %s... ",
    messageText.slice(0, 100),
  );

  // Check custom responses first - search for patterns in the message text
  const mockResponse =
    Object.entries(customMockResponses).find(([pattern, _response]) =>
      messageText.toLowerCase().includes(pattern.toLowerCase()),
    )?.[1] ?? fallbackResponse;

  logger(
    "DeepSeek API mock - matched response: %s",
    mockResponse.slice(0, 100),
  );
  return createStreamingResponse(mockResponse);
}

/**
 * Create a streaming response in OpenAI Responses API format
 */
function createStreamingResponse(
  mockResponse: string,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const responseId = `resp_${ulid()}`;
  const itemId = `item_${ulid()}`;
  let index = 0;

  return new ReadableStream({
    start(controller) {
      // 1. Send response.output_item.added with type "message" - triggers text-start
      const itemAddedEvent = {
        type: "response.output_item.added",
        output_index: 0,
        item: {
          type: "message",
          id: itemId,
        },
      };
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(itemAddedEvent)}\n\n`),
      );

      const chunkSize = 50;

      function sendNextChunk() {
        if (index >= mockResponse.length) {
          // 3. Send response.output_item.done with type "message" - triggers text-end
          const itemDoneEvent = {
            type: "response.output_item.done",
            output_index: 0,
            item: {
              type: "message",
              id: itemId,
            },
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(itemDoneEvent)}\n\n`),
          );

          // 4. Send response.completed
          const completedEvent = {
            type: "response.completed",
            response: {
              id: responseId,
              status: "completed",
              usage: {
                input_tokens: 100,
                output_tokens: Math.ceil(mockResponse.length / 4),
              },
            },
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(completedEvent)}\n\n`),
          );

          // Send [DONE]
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          logger("streaming response now closed");
          return;
        }

        const chunk = mockResponse.slice(index, index + chunkSize);
        index += chunkSize;

        // 2. Send response.output_text.delta - triggers text-delta
        const deltaEvent = {
          type: "response.output_text.delta",
          item_id: itemId,
          delta: chunk,
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(deltaEvent)}\n\n`),
        );

        // Schedule next chunk
        void Promise.resolve().then(sendNextChunk);
      }

      sendNextChunk();
    },
  });
}

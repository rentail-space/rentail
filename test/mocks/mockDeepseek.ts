/**
 * DeepSeek API Streaming Response Handler
 *
 * OpenAI Chat Completions API format (used by @ai-sdk/deepseek)
 */

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
  // Chat Completions API format
  const { messages } = body as {
    messages?: Array<{
      role: string;
      content: string | Array<{ type: string; text?: string }>;
    }>;
  };

  logger("DeepSeek API mock - raw messages: %j", messages);

  // Extract the LAST user message text for pattern matching
  let messageText = "";
  if (Array.isArray(messages)) {
    const userMessages = messages.filter((msg) => msg.role === "user");
    const lastUserMessage = userMessages[userMessages.length - 1];
    if (lastUserMessage) {
      if (typeof lastUserMessage.content === "string") {
        messageText = lastUserMessage.content;
      } else if (Array.isArray(lastUserMessage.content)) {
        messageText = lastUserMessage.content
          .filter((c) => c.type === "text")
          .map((c) => c.text || "")
          .join(" ");
      }
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
 * Create a streaming response in OpenAI Chat Completions API format
 */
function createStreamingResponse(
  mockResponse: string,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const responseId = `chatcmpl-${ulid()}`;
  let index = 0;

  return new ReadableStream({
    start(controller) {
      const chunkSize = 50;

      function sendNextChunk() {
        if (index >= mockResponse.length) {
          // Send the final [DONE] message
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          logger("streaming response now closed");
          return;
        }

        const chunk = mockResponse.slice(index, index + chunkSize);
        index += chunkSize;

        // Chat Completions streaming format
        const deltaEvent = {
          id: responseId,
          object: "chat.completion.chunk",
          created: Math.floor(Date.now() / 1000),
          model: "deepseek-chat",
          choices: [
            {
              index: 0,
              delta: { content: chunk },
              finish_reason: null,
            },
          ],
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

/**
 * Anthropic API Streaming Response Handler
 *
 * This module handles the creation of streaming responses that match
 * the Anthropic API's Server-Sent Events format.
 */

import type { Tool, ToolChoice } from "ai";
import debug from "debug";
import { invariant, last } from "es-toolkit";
import { ulid } from "ulid";

/**
 * Custom mock responses that you can define for specific test scenarios
 */
const customMockResponses = {
  "clothing boutique":
    "Perfect! I found some great locations for your clothing boutique. Here are the top options with excellent foot traffic.",

  "locations available":
    "We have some great locations available. Here are the top options with excellent foot traffic.",

  "looking for a pop-up retail space for my clothing boutique":
    "Perfect! I found some great locations for your clothing boutique. Here are the top options with excellent foot traffic.",

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

interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Default fallback response when no patterns match
 */
const fallbackResponse: string = "Fallback response!";

/**
 * Find a matching response for the given message
 */
export function findMockResponse(body: object): ReadableStream<Uint8Array> {
  const { messages } = body as {
    messages: Array<{
      role: string;
      content: Array<{ type: string; text: string }>;
    }>;
    tools: { name: string }[];
    tool_choice: { type: ToolChoice<Record<string, Tool>> };
  };

  // Extract the last user message from the request
  const lastMessage = last(messages);
  invariant(lastMessage, "Last message is required");

  // Get the text content from the message
  const messageText = lastMessage.content.map((part) => part.text).join(" ");

  debug("msw")(
    "Anthropic API mock - processing message: %s... ",
    messageText.slice(0, 100),
  );

  // Check custom responses first (higher priority)
  const mockResponse =
    Object.entries(customMockResponses).find(([pattern, _response]) =>
      messageText.toLowerCase().includes(pattern.toLowerCase()),
    )?.[1] ?? fallbackResponse;

  return createStreamingResponse(mockResponse, []);
}

/**
 * Create a streaming response that mimics Anthropic's API format
 */
export default function createStreamingResponse(
  mockResponse: string,
  toolCalls: ToolCall[],
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;
  let currentBlockIndex = 0;

  return new ReadableStream({
    start(controller) {
      // Send message_start event
      const messageStart = createMessageStartEvent();
      controller.enqueue(encoder.encode(messageStart));

      // If we need to include a tool call, send it first
      for (const toolCall of toolCalls) {
        // Send tool use content block start
        const toolUseStart = createToolUseContentBlockStartEvent(
          currentBlockIndex,
          toolCall,
        );
        controller.enqueue(encoder.encode(toolUseStart));

        // Send tool use input delta (for Anthropic format)
        const toolInputDelta = createToolUseInputDeltaEvent(
          currentBlockIndex,
          toolCall.input,
        );
        controller.enqueue(encoder.encode(toolInputDelta));

        // Send tool use content block stop
        const toolUseStop = createContentBlockStopEvent(currentBlockIndex);
        controller.enqueue(encoder.encode(toolUseStop));

        currentBlockIndex++;
      }

      // Send text content_block_start event
      const contentBlockStart = createContentBlockStartEvent(currentBlockIndex);
      controller.enqueue(encoder.encode(contentBlockStart));

      // Send content in chunks to simulate streaming
      const chunkSize = 50;

      function sendNextChunk() {
        if (index >= mockResponse.length) {
          // Send content_block_stop event
          const contentBlockStop =
            createContentBlockStopEvent(currentBlockIndex);
          controller.enqueue(encoder.encode(contentBlockStop));

          // Send message_stop event
          const messageStop = createMessageStopEvent();
          controller.enqueue(encoder.encode(messageStop));

          controller.close();
          debug("msw")("streaming response now closed");
          return;
        }

        const chunk = mockResponse.slice(index, index + chunkSize);
        index += chunkSize;

        // Send content_block_delta event
        const contentDelta = createContentBlockDeltaEvent(
          chunk,
          currentBlockIndex,
        );
        controller.enqueue(encoder.encode(contentDelta));

        // Schedule next chunk with small delay to simulate streaming
        setTimeout(sendNextChunk);
      }

      sendNextChunk();
    },
  });
}

/**
 * Create message_start event
 */
function createMessageStartEvent(): string {
  const event = {
    type: "message_start",
    message: {
      id: `msg_${ulid()}`,
      type: "message",
      role: "assistant",
      content: [],
      model: "claude-haiku-4-5",
      stop_reason: null,
      stop_sequence: null,
      usage: { input_tokens: 0, output_tokens: 0 },
    },
  };
  return `event: message_start\ndata: ${JSON.stringify(event)}\n\n`;
}

/**
 * Create tool use content_block_start event
 */
function createToolUseContentBlockStartEvent(
  index: number,
  toolCall: ToolCall,
): string {
  const event = {
    type: "content_block_start",
    index: index,
    content_block: {
      type: "tool_use",
      id: toolCall.id,
      name: toolCall.name,
      input: {},
    },
  };
  return `event: content_block_start\ndata: ${JSON.stringify(event)}\n\n`;
}

/**
 * Create tool use input delta event (streams the tool input)
 */
function createToolUseInputDeltaEvent(
  index: number,
  input: Record<string, unknown>,
): string {
  const event = {
    type: "content_block_delta",
    index: index,
    delta: {
      type: "input_json_delta",
      partial_json: JSON.stringify(input),
    },
  };
  return `event: content_block_delta\ndata: ${JSON.stringify(event)}\n\n`;
}

/**
 * Create text content_block_start event
 */
function createContentBlockStartEvent(index = 0): string {
  const event = {
    type: "content_block_start",
    index: index,
    content_block: {
      type: "text",
      text: "",
    },
  };
  return `event: content_block_start\ndata: ${JSON.stringify(event)}\n\n`;
}

/**
 * Create content_block_delta event
 */
function createContentBlockDeltaEvent(text: string, index = 0): string {
  const event = {
    type: "content_block_delta",
    index: index,
    delta: {
      type: "text_delta",
      text: text,
    },
  };
  return `event: content_block_delta\ndata: ${JSON.stringify(event)}\n\n`;
}

/**
 * Create content_block_stop event
 */
function createContentBlockStopEvent(index = 0): string {
  const event = {
    type: "content_block_stop",
    index: index,
  };
  return `event: content_block_stop\ndata: ${JSON.stringify(event)}\n\n`;
}

/**
 * Create message_stop event
 */
function createMessageStopEvent(): string {
  const event = {
    type: "message_stop",
  };
  return `event: message_stop\ndata: ${JSON.stringify(event)}\n\n`;
}

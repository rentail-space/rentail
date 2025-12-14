/**
 * Anthropic API Streaming Response Handler
 *
 * This module handles the creation of streaming responses that match
 * the Anthropic API's Server-Sent Events format.
 */

import debug from "debug";
import { invariant, last } from "es-toolkit";
import { ulid } from "ulid";
import { conversational } from "~/lib/model";

const logger = debug("msw");

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
  const { messages, tools, tool_choice } = body as {
    messages: Array<{
      role: string;
      content: Array<{ type: string; text: string }>;
    }>;
    tools?: { name: string; input_schema?: unknown }[];
    tool_choice?: { type: string; name?: string };
  };

  // Extract the last user message from the request
  const lastMessage = last(messages);
  invariant(lastMessage, "Last message is required");

  // Get the text content from the message
  const messageText = lastMessage.content.map((part) => part.text).join(" ");

  logger(
    "Anthropic API mock - processing message: %s... ",
    messageText.slice(0, 100),
  );

  // Check if this is a structured output request (tool call)
  if (tools && tool_choice?.type === "tool") {
    // For structured output, return mock data via tool call
    const toolName = tool_choice.name || tools[0]?.name;
    logger("Structured output request for tool: %s", toolName);

    // Generate mock centers data for discoverCenters
    if (
      messageText.toLowerCase().includes("shopping centers") ||
      messageText.toLowerCase().includes("malls in")
    ) {
      const mockCenters = {
        centers: [
          {
            name: "Westfield Century City",
            address: "10250 Santa Monica Blvd",
            city: "Los Angeles",
            state: "CA",
            website: "https://www.westfield.com/centurycity",
            latitude: 34.0575,
            longitude: -118.4148,
          },
          {
            name: "The Grove",
            address: "189 The Grove Dr",
            city: "Los Angeles",
            state: "CA",
            website: "https://thegrovela.com",
            latitude: 34.0719,
            longitude: -118.3569,
          },
        ],
      };

      const toolCall: ToolCall = {
        id: `call_${ulid()}`,
        name: toolName || "json",
        input: mockCenters,
      };

      return createStreamingResponse("", [toolCall]);
    }
  }

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

      // Only send text content if there is text to send
      if (mockResponse.length > 0) {
        // Send text content_block_start event
        const contentBlockStart =
          createContentBlockStartEvent(currentBlockIndex);
        controller.enqueue(encoder.encode(contentBlockStart));
      }

      // Send content in chunks to simulate streaming
      const chunkSize = 50;

      function sendNextChunk() {
        if (index >= mockResponse.length) {
          // Only send text content block stop if we sent text content
          if (mockResponse.length > 0) {
            const contentBlockStop =
              createContentBlockStopEvent(currentBlockIndex);
            controller.enqueue(encoder.encode(contentBlockStop));
          }

          // Send message_delta with stop_reason
          const stopReason = toolCalls.length > 0 ? "tool_use" : "end_turn";
          const messageDelta = createMessageDeltaEvent(stopReason);
          controller.enqueue(encoder.encode(messageDelta));

          // Send message_stop event
          const messageStop = createMessageStopEvent();
          controller.enqueue(encoder.encode(messageStop));

          controller.close();
          logger("streaming response now closed");
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

        // Schedule next chunk using Promise microtask queue instead of setTimeout
        // This ensures chunks are sent reliably in test environments
        Promise.resolve().then(sendNextChunk);
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
      model: conversational.model.modelId,
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
  // For generateObject, we need to ensure the JSON is valid and complete
  // Stream the entire JSON object at once for simplicity in tests
  const jsonString = JSON.stringify(input);
  const event = {
    type: "content_block_delta",
    index: index,
    delta: {
      type: "input_json_delta",
      partial_json: jsonString,
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
 * Create message_delta event (for stop_reason)
 */
function createMessageDeltaEvent(stopReason: string): string {
  const event = {
    type: "message_delta",
    delta: {
      stop_reason: stopReason,
    },
    usage: { output_tokens: 100 },
  };
  return `event: message_delta\ndata: ${JSON.stringify(event)}\n\n`;
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

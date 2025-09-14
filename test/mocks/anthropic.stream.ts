/**
 * Anthropic API Streaming Response Handler
 *
 * This module handles the creation of streaming responses that match
 * the Anthropic API's Server-Sent Events format.
 */

import { ulid } from "ulid";

/**
 * Create a streaming response that mimics Anthropic's API format
 */
export default function createStreamingResponse(
  mockResponse: string,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;

  return new ReadableStream({
    start(controller) {
      // Simulate initial delay
      setImmediate(() => {
        // Send message_start event
        const messageStart = createMessageStartEvent();
        controller.enqueue(encoder.encode(messageStart));

        // Send content_block_start event
        const contentBlockStart = createContentBlockStartEvent();
        controller.enqueue(encoder.encode(contentBlockStart));

        // Send content in chunks to simulate streaming
        const chunkSize = Math.max(1, Math.floor(mockResponse.length / 10)); // Split into ~10 chunks

        function sendNextChunk() {
          if (index >= mockResponse.length) {
            // Send content_block_stop event
            const contentBlockStop = createContentBlockStopEvent();
            controller.enqueue(encoder.encode(contentBlockStop));

            // Send message_stop event
            const messageStop = createMessageStopEvent();
            controller.enqueue(encoder.encode(messageStop));

            controller.close();
            return;
          }

          const chunk = mockResponse.slice(index, index + chunkSize);
          index += chunkSize;

          // Send content_block_delta event
          const contentDelta = createContentBlockDeltaEvent(chunk);
          controller.enqueue(encoder.encode(contentDelta));

          // Schedule next chunk with small delay to simulate streaming
          setImmediate(sendNextChunk);
        }

        sendNextChunk();
      });
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
      model: "claude-sonnet-4-20250514",
      stop_reason: null,
      stop_sequence: null,
      usage: { input_tokens: 0, output_tokens: 0 },
    },
  };
  return `event: message_start\ndata: ${JSON.stringify(event)}\n\n`;
}

/**
 * Create content_block_start event
 */
function createContentBlockStartEvent(): string {
  const event = {
    type: "content_block_start",
    index: 0,
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
function createContentBlockDeltaEvent(text: string): string {
  const event = {
    type: "content_block_delta",
    index: 0,
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
function createContentBlockStopEvent(): string {
  const event = {
    type: "content_block_stop",
    index: 0,
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

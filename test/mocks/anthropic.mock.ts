/**
 * Anthropic API Mock for Testing
 *
 * This module provides a flexible mock system for the Anthropic API that allows
 * you to define responses based on the last user message or message patterns.
 */

import type { Tool, ToolChoice } from "ai";
import debug from "debug";
import { invariant, last } from "es-toolkit";
import createStreamingResponse, {
  type ToolCall,
} from "~/test/mocks/anthropic.stream";

interface MessagePattern {
  // Pattern to match against the last user message
  pattern: string | RegExp;
  response: string;
}

/**
 * Custom mock responses that you can define for specific test scenarios
 */
export const customMockResponses: MessagePattern[] = [
  {
    pattern: /clothing boutique/,
    response:
      "Perfect! I found some great locations for your clothing boutique. Here are the top options with excellent foot traffic.",
  },
  {
    pattern: /locations available/,
    response:
      "We have some great locations available. Here are the top options with excellent foot traffic.",
  },
  {
    pattern: /Boston/i,
    response: "Thanks for letting me know!",
  },
];

/**
 * Default fallback response when no patterns match
 */
const fallbackResponse: string =
  "I'm here to help you find the perfect retail space for your business. Could you tell me more about what you're looking for? For example:\n\n• What type of business are you planning?\n• What area or neighborhood interests you?\n• What size space do you need?\n• What's your budget range?\n\nThe more details you share, the better I can assist you!";

/**
 * Find a matching response for the given message
 */
export function findMockResponse(body: {
  messages: Array<{
    role: string;
    content: Array<{ type: string; text: string }>;
  }>;
  tools: { name: string }[];
  tool_choice: { type: ToolChoice<Record<string, Tool>> };
}): ReadableStream<Uint8Array> {
  // Extract the last user message from the request
  const message = last(body.messages);
  debug("msw")("message", message);
  invariant(message, "Last message is required");

  // Get the text content from the message
  const messageText = message.content
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join(" ");

  debug("msw")(
    `Anthropic API mock - processing message: "${messageText.slice(0, 100)}..."`,
  );
  debug("msw")(
    "Anthropic API mock - processing message: %s... ",
    messageText.slice(0, 100),
  );

  // Check custom responses first (higher priority)
  const response = customMockResponses.find((mockPattern) =>
    matchesPattern(messageText, mockPattern.pattern),
  );

  const toolCalls: ToolCall[] = [];

  if (
    body.tool_choice?.type === "auto" &&
    body.tools.find((tool) => tool.name === "updateWorkingMemory") &&
    last(body.messages)?.content.some(
      (content) =>
        content.type === "text" && content.text.includes("I'm in Boston"),
    )
  ) {
    // Create a tool call for updating working memory with the exact format Mastra expects
    const updateWorkingMemoryTool = {
      id: `toolu_${Date.now()}`,
      name: "updateWorkingMemory", // This is the exact name Mastra's ToolCallFilter looks for
      input: {
        memory: {
          // Mastra expects the data under 'memory' key
          location: {
            city: "Boston",
            state: "Massachusetts",
            country: "United States",
            latitude: 42.3601,
            longitude: -71.0589,
            timeZone: "America/New_York",
          },
        },
      },
    };
    toolCalls.push(updateWorkingMemoryTool);
  }

  return createStreamingResponse(
    response?.response ?? fallbackResponse,
    toolCalls,
  );
}

/**
 * Check if a message matches a pattern
 */
function matchesPattern(message: string, pattern: string | RegExp): boolean {
  if (typeof pattern === "string")
    return message.toLowerCase().includes(pattern.toLowerCase());
  return pattern.test(message);
}

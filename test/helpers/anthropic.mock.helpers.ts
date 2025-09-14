/**
 * Test helpers for Anthropic API mocking
 * 
 * This module provides convenient functions for setting up mock responses
 * in your tests.
 */

import {
  addMockResponse,
  clearCustomMockResponses,
  setCustomMockResponses,
  type MessagePattern,
  type MockResponse,
} from "../mocks/anthropic.mock";

/**
 * Set up a mock response for a specific message pattern in a test
 * 
 * @example
 * ```typescript
 * // In your test
 * mockAnthropicResponse(/clothing store/, {
 *   content: "Great choice! Here are some clothing store locations...",
 *   delay: 200
 * });
 * ```
 */
export function mockAnthropicResponse(
  pattern: string | RegExp,
  response: MockResponse
) {
  addMockResponse({ pattern, response });
}

/**
 * Set up multiple mock responses at once
 * 
 * @example
 * ```typescript
 * mockAnthropicResponses([
 *   {
 *     pattern: /restaurant/i,
 *     response: { content: "Restaurant spaces available..." }
 *   },
 *   {
 *     pattern: /boutique/i,
 *     response: { content: "Boutique locations ready..." }
 *   }
 * ]);
 * ```
 */
export function mockAnthropicResponses(patterns: MessagePattern[]) {
  setCustomMockResponses(patterns);
}

/**
 * Mock an error response from Anthropic API
 * 
 * @example
 * ```typescript
 * mockAnthropicError(/error test/, {
 *   type: "rate_limit_error",
 *   message: "Too many requests"
 * });
 * ```
 */
export function mockAnthropicError(
  pattern: string | RegExp,
  error: { type: string; message: string }
) {
  addMockResponse({
    pattern,
    response: { content: "", error }
  });
}

/**
 * Clear all custom mock responses (useful in afterEach hooks)
 */
export function clearAnthropicMocks() {
  clearCustomMockResponses();
}

/**
 * Create a quick mock response with just content
 * 
 * @example
 * ```typescript
 * mockAnthropicResponse(/quick test/, quickMockResponse("Simple response"));
 * ```
 */
export function quickMockResponse(
  content: string,
  delay: number = 100
): MockResponse {
  return { content, delay };
}

/**
 * Create a mock response that simulates a long streaming response
 * 
 * @example
 * ```typescript
 * mockAnthropicResponse(/long response/, longMockResponse([
 *   "This is a very long response",
 *   "that will be streamed",
 *   "in multiple chunks to test",
 *   "the streaming functionality."
 * ].join(" ")));
 * ```
 */
export function longMockResponse(content: string): MockResponse {
  return {
    content,
    delay: 300,
    streaming: true
  };
}

/**
 * Pre-defined test scenarios for common use cases
 */
export const testScenarios = {
  /** Mock response for clothing/fashion related queries */
  fashionBoutique: {
    pattern: /clothing|fashion|boutique|apparel/i,
    response: quickMockResponse(
      "Perfect for a fashion boutique! Here are premium retail spaces with excellent visibility and foot traffic."
    )
  },

  /** Mock response for food/restaurant queries */
  restaurant: {
    pattern: /food|restaurant|cafe|dining/i,
    response: quickMockResponse(
      "Great for food service! These locations come with commercial kitchen capabilities and proper ventilation."
    )
  },

  /** Mock response for budget/pricing queries */
  budgetInquiry: {
    pattern: /price|cost|budget|cheap|expensive/i,
    response: quickMockResponse(
      "Our spaces range from $30-65 per square foot monthly, with flexible lease terms starting at 3 months."
    )
  },

  /** Mock response that simulates an API error */
  apiError: {
    pattern: /test error/i,
    response: {
      content: "",
      error: {
        type: "overloaded_error",
        message: "The service is temporarily overloaded"
      }
    }
  },

  /** Mock response with a delay to test loading states */
  slowResponse: {
    pattern: /slow response/i,
    response: {
      content: "This response was intentionally delayed for testing loading states.",
      delay: 2000
    }
  }
};

/**
 * Apply a test scenario quickly
 * 
 * @example
 * ```typescript
 * applyTestScenario('fashionBoutique');
 * // Now any message matching the fashion pattern will get the boutique response
 * ```
 */
export function applyTestScenario(scenarioName: keyof typeof testScenarios) {
  const scenario = testScenarios[scenarioName];
  if (scenario) {
    addMockResponse(scenario);
  }
}
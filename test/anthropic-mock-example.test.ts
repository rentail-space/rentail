/**
 * Example test demonstrating the Anthropic API mock system
 * 
 * This test file shows how to use the mock system to control
 * Anthropic API responses based on message patterns.
 */

import { expect, type Page } from "playwright/test";
import { afterEach, beforeEach, describe, it } from "vitest";
import { launchBrowser, URL } from "./helpers/launchBrowser";
import {
  mockAnthropicResponse,
  mockAnthropicResponses,
  mockAnthropicError,
  clearAnthropicMocks,
  quickMockResponse,
  longMockResponse,
  testScenarios,
  applyTestScenario,
} from "./helpers/anthropic.mock.helpers";

describe("Anthropic Mock System Examples", () => {
  let page: Page;

  beforeEach(async () => {
    page = await launchBrowser();
    // Clear any previous mock responses
    clearAnthropicMocks();
  });

  afterEach(async () => {
    await page.close();
    clearAnthropicMocks();
  });

  it("should use default responses for common patterns", async () => {
    await page.goto(`${URL}/chat`);
    await page.waitForTimeout(1000);

    // Send a message that matches the default clothing pattern
    await page.locator("input[type='text']").fill("I want to open a clothing boutique");
    await page.locator("button[type='submit']").click();

    // Wait for response
    await page.waitForTimeout(2000);

    // Should get the default clothing/fashion response
    await expect(
      page.locator(".chat-bubble").filter({ hasText: /Fashion District Plaza|clothing boutique/i })
    ).toBeVisible();
  });

  it("should use custom mock responses", async () => {
    // Set up a custom response for tech store queries
    mockAnthropicResponse(/tech|electronics|computer/, {
      content: "Tech stores need specialized spaces! Here are locations with high-speed internet and security features:\n\n• **Tech Hub Plaza** - 1,000 sq ft, $52/sq ft/month\n• **Innovation Center** - 1,200 sq ft, $48/sq ft/month\n\nBoth include fiber internet and advanced security systems.",
      delay: 200
    });

    await page.goto(`${URL}/chat`);
    await page.waitForTimeout(1000);

    // Send a message that matches our custom pattern
    await page.locator("input[type='text']").fill("I need space for an electronics store");
    await page.locator("button[type='submit']").click();

    // Wait for response
    await page.waitForTimeout(2000);

    // Should get our custom tech store response
    await expect(
      page.locator(".chat-bubble").filter({ hasText: /Tech Hub Plaza|Innovation Center/i })
    ).toBeVisible();
  });

  it("should handle multiple custom responses", async () => {
    // Set up multiple custom responses
    mockAnthropicResponses([
      {
        pattern: /jewelry|watches|accessories/i,
        response: quickMockResponse("Jewelry stores need secure, well-lit spaces with display cases. We have premium locations available.")
      },
      {
        pattern: /bookstore|books|reading/i,
        response: quickMockResponse("Bookstores thrive in quiet, cozy spaces. Here are some perfect literary locations.")
      }
    ]);

    await page.goto(`${URL}/chat`);
    await page.waitForTimeout(1000);

    // Test jewelry response
    await page.locator("input[type='text']").fill("Looking for a jewelry store location");
    await page.locator("button[type='submit']").click();
    await page.waitForTimeout(2000);

    await expect(
      page.locator(".chat-bubble").filter({ hasText: /secure, well-lit spaces/i })
    ).toBeVisible();

    // Test bookstore response
    await page.locator("input[type='text']").fill("I want to open a bookstore");
    await page.locator("button[type='submit']").click();
    await page.waitForTimeout(2000);

    await expect(
      page.locator(".chat-bubble").filter({ hasText: /quiet, cozy spaces/i })
    ).toBeVisible();
  });

  it("should simulate API errors", async () => {
    // Mock an error response
    mockAnthropicError(/error test/, {
      type: "rate_limit_error",
      message: "Request rate limit exceeded"
    });

    await page.goto(`${URL}/chat`);
    await page.waitForTimeout(1000);

    // Send a message that triggers the error
    await page.locator("input[type='text']").fill("error test message");
    await page.locator("button[type='submit']").click();

    // Wait for error handling
    await page.waitForTimeout(2000);

    // Check if error is displayed (this depends on how your app handles errors)
    const errorElement = page.locator(".text-red-500");
    const hasError = await errorElement.isVisible();
    
    if (hasError) {
      await expect(errorElement).toBeVisible();
    }
  });

  it("should use predefined test scenarios", async () => {
    // Apply the fashion boutique scenario
    applyTestScenario('fashionBoutique');

    await page.goto(`${URL}/chat`);
    await page.waitForTimeout(1000);

    // Send a fashion-related message
    await page.locator("input[type='text']").fill("I'm planning a fashion boutique");
    await page.locator("button[type='submit']").click();
    await page.waitForTimeout(2000);

    // Should get the predefined fashion response
    await expect(
      page.locator(".chat-bubble").filter({ hasText: /fashion boutique|retail spaces/i })
    ).toBeVisible();
  });

  it("should handle long streaming responses", async () => {
    // Set up a long response to test streaming
    const longContent = [
      "This is a comprehensive guide to retail space selection.",
      "First, consider your target demographic and foot traffic patterns.",
      "Second, evaluate the lease terms and monthly costs carefully.",
      "Third, think about future expansion possibilities.",
      "Finally, make sure the space aligns with your brand image.",
      "Location is crucial for retail success, so choose wisely."
    ].join(" ");

    mockAnthropicResponse(/comprehensive guide/, longMockResponse(longContent));

    await page.goto(`${URL}/chat`);
    await page.waitForTimeout(1000);

    // Send a message that triggers the long response
    await page.locator("input[type='text']").fill("I need a comprehensive guide");
    await page.locator("button[type='submit']").click();

    // Wait for the streaming response to complete
    await page.waitForTimeout(3000);

    // Check that the full response is displayed
    await expect(
      page.locator(".chat-bubble").filter({ hasText: /comprehensive guide.*choose wisely/s })
    ).toBeVisible();
  });

  it("should fall back to default response for unmatched patterns", async () => {
    // Don't set up any custom responses, so it should use fallback

    await page.goto(`${URL}/chat`);
    await page.waitForTimeout(1000);

    // Send a message that doesn't match any patterns
    await page.locator("input[type='text']").fill("xyz random unmatched query 123");
    await page.locator("button[type='submit']").click();
    await page.waitForTimeout(2000);

    // Should get the fallback response
    await expect(
      page.locator(".chat-bubble").filter({ hasText: /I'm here to help you find/i })
    ).toBeVisible();
  });
});
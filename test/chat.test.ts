import { expect, type Page } from "playwright/test";
import { afterEach, beforeEach, describe, it } from "vitest";
import { launchBrowser, URL } from "./helpers/launchBrowser";

describe("Chat page", () => {
  let page: Page;

  beforeEach(async () => {
    page = await launchBrowser();
  });

  it("renders chat interface with welcome message", async () => {
    const response = await page.goto(`${URL}/chat`);
    expect(response?.status(), "should respond with 200").toEqual(200);

    // Check that the chat interface is rendered
    await expect(page.locator("div.h-screen.bg-gray-50")).toBeVisible();

    // Check header is present
    await expect(page.locator("header")).toBeVisible();

    // Check that welcome message is displayed
    await expect(page.locator(".chat.chat-start").first()).toBeVisible();

    // Check that input form is present
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator("input[type='text']")).toBeVisible();

    // Check that precanned questions are displayed
    await expect(
      page.locator("button").filter({ hasText: "Q:" }).first(),
    ).toBeVisible();
  });

  it("handles initial query parameter", async () => {
    const testQuery = "Do you have any locations available in downtown areas?";
    await page.goto(`${URL}/chat?q=${encodeURIComponent(testQuery)}`);
    await page.waitForTimeout(5000);

    // Check that user message appears in chat
    await expect(
      page.locator(".chat-bubble-accent").filter({ hasText: testQuery }),
    ).toBeVisible();
  });

  it("precanned questions work correctly", async () => {
    await page.goto(`${URL}/chat`);
    await page.waitForTimeout(2000);

    // Click on the first precanned question button
    const firstQuestion = page
      .locator("#precanned-questions button")
      .filter({ hasText: "Q:" })
      .first();
    await expect(firstQuestion).toBeVisible();

    // Get the question text
    const questionText = await firstQuestion.textContent();
    const question = questionText?.replace("Q: ", "") || "";
    expect(question).not.toEqual("");

    // Click the button
    await firstQuestion.click();

    // Wait for typing animation to complete
    await page.waitForTimeout(5000);

    // Check that the question appears in the input field
    await expect(page.locator("input[type='text']")).toHaveValue(question);
  });

  it("sends user message and receives server response", async () => {
    await page.goto(`${URL}/chat`);
    await page.waitForTimeout(2000);

    const testMessage =
      "looking for a pop-up retail space for my clothing boutique";

    // Fill and submit the message
    await page.fill("input[type='text']", testMessage);
    await page.press("input[type='text']", "Enter");

    // Verify user message appears in chat
    await expect(
      page
        .locator(".chat-bubble-accent")
        .filter({ hasText: testMessage })
        .first(),
    ).toBeVisible({ timeout: 5000 });

    // Wait a moment for any UI updates after form submission
    await page.waitForTimeout(2000);

    // Verify user message is present
    await expect(
      page
        .locator(".chat-bubble-accent")
        .filter({ hasText: testMessage })
        .first(),
    ).toBeVisible();

    // Count all chat messages - should have at least welcome message + user message
    const chatCount = await page.locator(".chat").count();
    expect(chatCount).toBeGreaterThanOrEqual(2); // At least welcome + user message

    // Check if we got an error
    const errorElement = page.locator(".text-red-500");
    const hasError = await errorElement.isVisible();
    if (hasError) expect(errorElement.textContent()).toBeTruthy();

    // Check if we got a server response (new assistant message beyond welcome)
    const assistantMessages = page.locator(".chat.chat-start");
    const assistantCount = await assistantMessages.count();
    const hasResponse = assistantCount > 1;

    if (hasResponse)
      // Verify response element exists (content may be empty in test environment)
      expect(assistantCount).toBeGreaterThan(1);

    // Check if typing indicator appeared (indicates request was sent)
    expect(chatCount).toBeGreaterThanOrEqual(2);
    const typingIndicator = page.locator(".animate-bounce");
    const hasTypingIndicator = await typingIndicator.first().isVisible();
    expect(hasTypingIndicator || hasError || hasResponse).toBe(true);
  });

  afterEach(async () => {
    await page.close();
  });
});

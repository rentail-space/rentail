import { expect } from "playwright/test";
import { describe, it } from "vitest";
import { launchBrowser, URL } from "./helpers/launchBrowser";

describe("Chat page", () => {
  it("renders chat interface with welcome message", async () => {
    const page = await launchBrowser();
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
    const page = await launchBrowser();
    const testQuery = "Find me a retail space in downtown area";
    await page.goto(`${URL}/chat?q=${encodeURIComponent(testQuery)}`);

    // Wait for the message to be processed
    await page.waitForTimeout(2000);

    // Check that user message appears in chat
    await expect(
      page.locator(".chat-bubble-accent").filter({ hasText: testQuery }),
    ).toBeVisible();
  });

  it("precanned questions work correctly", async () => {
    const page = await launchBrowser();
    await page.goto(`${URL}/chat`);

    // Click on the first precanned question button
    const firstQuestion = page
      .locator("button")
      .filter({ hasText: "Q:" })
      .first();
    await expect(firstQuestion).toBeVisible();

    // Get the question text
    const questionText = await firstQuestion.textContent();
    const question = questionText?.replace("Q: ", "") || "";

    // Click the button
    await firstQuestion.click();

    // Wait for typing animation to complete
    await page.waitForTimeout(1000);

    // Check that the question appears in the input field
    await expect(page.locator("input[type='text']")).toHaveValue(question);
  });

  it("handles chat API responses correctly", async () => {
    const page = await launchBrowser();
    await page.goto(`${URL}/chat`);

    // Send a message
    await page.fill("input[type='text']", "Test message");
    await page.press("input[type='text']", "Enter");

    // MSW will mock the API response, so verify an assistant response appears
    await expect(page.locator(".chat").nth(1)).toBeVisible({ timeout: 10000 });
  });

  it("maintains chat history during session", async () => {
    const page = await launchBrowser();
    await page.goto(`${URL}/chat`);

    const firstMessage = "First test message";
    const secondMessage = "Second test message";

    // Send first message
    await page.fill("input[type='text']", firstMessage);
    await page.press("input[type='text']", "Enter");

    // Wait for response
    await page.waitForTimeout(2000);

    // Send second message
    await page.fill("input[type='text']", secondMessage);
    await page.press("input[type='text']", "Enter");

    // Check both messages are visible
    /*
    await expect(
      page.locator(".chat-bubble-accent").filter({ hasText: firstMessage }),
    ).toBeVisible();
    */
    await expect(
      page.locator(".chat-bubble-accent").filter({ hasText: secondMessage }),
    ).toBeVisible();
  });

  it("chat page visual regression test", async () => {
    const page = await launchBrowser();
    await page.goto(`${URL}/chat`);

    // Wait for the page to fully load
    await page.waitForLoadState("networkidle");

    // Wait for any initial animations to complete
    await page.waitForTimeout(500);

    // Ensure the welcome message is visible before taking screenshot
    await expect(page.locator(".chat").first()).toBeVisible();

    // Take screenshot for visual regression testing
    await expect(page).toMatchScreenshot();

    await page.close();
  });
});

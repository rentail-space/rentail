import { delay } from "es-toolkit";
import { expect, type Page } from "playwright/test";
import { afterEach, beforeEach, describe, it } from "vitest";
import env from "~/lib/env";
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
    await expect(page.locator("div.h-screen")).toBeVisible();

    // Check header is present
    await expect(page.locator("header")).toBeVisible();

    // Check that welcome message is displayed
    await expect(page.locator(".chat.chat-start").first()).toBeVisible();

    // Check that input form is present
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator("input[type='text']")).toBeVisible();
  });

  it("handles initial query parameter", async () => {
    const testQuery = "Do you have any locations available in downtown areas?";
    await page.goto(`${URL}/chat?q=${encodeURIComponent(testQuery)}`);
    await page.waitForLoadState("networkidle");

    // Check that user message appears in chat
    await expect(
      page.locator(".chat-bubble-accent").filter({ hasText: testQuery }),
    ).toBeVisible();
  });

  it("sends user message and receives server response", async () => {
    await page.goto(`${URL}/chat`);
    await page.waitForLoadState("networkidle");

    const testMessage =
      "looking for a pop-up retail space for my clothing boutique";

    // Fill and submit the message
    await page.fill("input[type='text']", testMessage);
    await page.press("input[type='text']", "Enter");
    await page.waitForLoadState("networkidle");

    // Verify user message appears in chat
    await expect(
      page
        .locator(".chat-bubble-accent")
        .filter({ hasText: testMessage })
        .first(),
    ).toBeVisible();

    // Verify we got our mock response
    await expect(
      page
        .locator(".chat-bubble")
        .filter({ hasText: /Perfect! I found some great locations/i }),
    ).toBeVisible();

    // Count all chat messages - should have welcome + user + assistant response
    const chatCount = await page.locator(".chat").count();
    expect(chatCount).toBeGreaterThanOrEqual(3); // welcome + user + response

    // Verify page is scrolled to bottom after response
    const scrollContainer = page.locator(".overflow-y-auto").first();
    const scrollTop = await scrollContainer.evaluate((el) => el.scrollTop);
    const scrollHeight = await scrollContainer.evaluate(
      (el) => el.scrollHeight,
    );
    const clientHeight = await scrollContainer.evaluate(
      (el) => el.clientHeight,
    );

    // Should be at or very close to bottom (within 50px tolerance)
    expect(scrollTop + clientHeight).toBeGreaterThan(scrollHeight - 50);
  });

  afterEach(async () => {
    if (env.isDebug) await delay(3000);
    await page.close();
  });
});

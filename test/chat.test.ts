import { invariant } from "node_modules/es-toolkit/dist/util/invariant.mjs";
import { expect, type Page } from "playwright/test";
import type { Messages } from "prisma/generated/client";
import { beforeAll, describe, it } from "vitest";
import prisma from "~/lib/prisma";
import { goto } from "~/test/helpers/launchBrowser";

const testMessage =
  "looking for a pop-up retail space for my clothing boutique";

describe("Chat page", () => {
  it("renders chat interface with welcome message", async () => {
    const page = await goto("/chat");
    // Check that the chat interface is rendered
    await expect(page.locator("div.h-screen")).toBeVisible();

    // Check header is present
    await expect(page.locator("header")).toBeVisible();

    // Check that welcome message is displayed
    await expect(page.locator(".chat.chat-start").first()).toBeVisible();

    // Check that input form is present
    await expect(page.locator("form")).toBeVisible();
    await expect(page.getByRole("textbox")).toBeVisible();
  });

  it("handles initial query parameter", async () => {
    const testQuery = "Do you have any locations available in downtown areas?";
    const page = await goto(`/chat?q=${encodeURIComponent(testQuery)}`);

    // Check that user message appears in chat
    await expect(page.getByRole("textbox")).toHaveValue(testQuery);
  });

  describe("exchange messages", () => {
    let page: Page;
    let message: Messages;

    beforeAll(async () => {
      page = await goto("/chat");
      await page.getByRole("textbox").fill(testMessage);
      await page.getByRole("button", { name: "Send" }).click();
      await page.waitForLoadState("networkidle");

      message = await prisma.messages.findFirstOrThrow({
        orderBy: { createdAt: "desc" },
      });
    });

    it("should look like a real chat", async () => {
      // Take screenshot for visual regression testing
      await expect(page).toMatchScreenshot();
    });

    it("should show user message in chat", async () => {
      await expect(
        page.locator(".chat-bubble-accent").filter({ hasText: testMessage }),
      ).toBeVisible();
    });

    it("should show assistant message in chat", async () => {
      invariant(message?.content, "Message content is required");
      const multipleLines = JSON.parse(message.content as string).parts.map(
        (part: { text: string }) => part.text,
      );
      const firstLine = multipleLines.join("\n").split("\n")[0];
      await expect(
        page.locator(".chat-bubble").filter({ hasText: firstLine }),
      ).toBeVisible();
    });

    it("shoudl have at 3 messages in chat", async () => {
      const chatCount = await page.locator(".chat").count();
      expect(chatCount).toEqual(3); // welcome + user + response
    });

    it("should have a scroll container", async () => {
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
  });
});

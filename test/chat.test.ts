import { type Page, expect } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import prisma from "~/lib/prisma";
import { goto } from "~/test/helpers/launchBrowser";
import converse from "./helpers/converse";

describe("Chat page", () => {
  describe("interface with welcome message", () => {
    let page: Page;

    beforeAll(async () => {
      page = await goto("/chat");
    });

    it("should show the welcome message", async () => {
      const welcomeBubble = page.locator(".chat-bubble-response");
      await expect(welcomeBubble).toBeVisible();

      const welcomeText = await welcomeBubble.innerText();
      expect(welcomeText).toMatch(/Welcome to rentail\.space!/);
      expect(welcomeText).toMatch(/virtual assistant/);
      expect(welcomeText).toMatch(/How can I assist you today?/);
    });

    it("should have a form for the user to input messages", async () => {
      await expect(page.locator("form")).toBeVisible();
      await expect(page.getByRole("textbox")).toBeVisible();
    });

    afterAll(async () => {
      await page.close();
    });
  });

  describe("initial query parameter", () => {
    let page: Page;
    const testQuery = "Do you have any locations available in downtown areas?";

    beforeAll(async () => {
      await prisma.user.deleteMany();
      page = await goto(`/chat?q=${encodeURIComponent(testQuery)}`);
    });

    it("should handle initial query parameter", async () => {
      await expect(page.getByRole("textbox")).toHaveValue(testQuery);
    });

    afterAll(async () => {
      await page.close();
    });
  });

  describe("exchange messages", () => {
    let page: Page;

    beforeAll(async () => {
      page = await goto("/chat", {
        "x-vercel-ip-latitude": "34.04592",
        "x-vercel-ip-longitude": "-118.34574",
      });
      await converse(
        page,
        "looking for a pop-up retail space for my clothing boutique",
      );
    });

    it("should look like a real chat", async () => {
      await page.waitForTimeout(100);
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(100);

      // Take screenshot for visual regression testing
      await expect(page).toMatchScreenshot();
    });

    it("should have welcome message, user message, and assistant response", async () => {
      const chatCount = await page.locator(".chat-bubble").count();
      expect(chatCount).toBeGreaterThanOrEqual(3);
    });

    it("should show user message in chat", async () => {
      await expect(
        page.locator(".chat-bubble-user", {
          hasText: /looking for a pop-up retail space/,
        }),
      ).toBeVisible();
    });

    it("should show assistant response in chat", async () => {
      // Just verify there's a response, don't assert specific content
      const lastResponse = page.locator(".chat-bubble-response").last();
      await expect(lastResponse).toBeVisible();
      const responseText = await lastResponse.innerText();
      expect(responseText.length).toBeGreaterThan(0);
    });

    it("should auto-scroll to bottom after response", async () => {
      // Verify page is scrolled to bottom after response
      const scrollContainer = page.locator(".overflow-y-auto").first();
      const scrollTop = await scrollContainer.evaluate((el) => el.scrollTop);
      const scrollHeight = await scrollContainer.evaluate(
        (el) => el.scrollHeight,
      );
      const clientHeight = await scrollContainer.evaluate(
        (el) => el.clientHeight,
      );

      // Calculate how far from bottom (allow small tolerance for rounding)
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      expect(distanceFromBottom).toBeLessThan(5);
    });

    it("should store correct data in database", async () => {
      const users = await prisma.user.findMany({
        include: { chats: { include: { messages: true } } },
      });
      // User assertions
      expect(users.length).toEqual(1);
      expect(users[0].isAnonymous).toBe(true);

      // Chat assertions
      const chats = users[0].chats;
      expect(chats.length).toEqual(1);
      expect(chats[0].activeStreamId).toBeNull(); // Stream should be complete

      // Message assertions
      const messages = chats[0].messages;
      expect(messages.length).toBeGreaterThanOrEqual(3);
      expect(messages.find((m) => m.role === "user")).toBeDefined();
      expect(messages.find((m) => m.role === "assistant")).toBeDefined();
    });
  });
});

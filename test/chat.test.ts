import { expect, type Page } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import prisma from "~/lib/prisma";
import { goto } from "~/test/helpers/launchBrowser";
import converse from "./helpers/converse";

const testMessage =
  "looking for a pop-up retail space for my clothing boutique";

describe("Chat page", () => {
  describe("interface with welcome message", () => {
    let page: Page;

    beforeAll(async () => {
      await prisma.user.deleteMany();
      page = await goto("/chat");
    });

    it("renders the chat page", async () => {
      await expect(page).toMatchScreenshot();
    });

    it("shows the welcome message", async () => {
      await expect(page.locator(".chat-bubble-response")).toBeVisible();
      await expect(page.locator(".chat-bubble-response")).toHaveText(
        /Welcome to rentail.space!/,
      );
      await expect(page.locator(".chat-bubble-response")).toHaveText(
        /I'm your virtual assistant here to help you find the perfect retail space for your business needs./,
      );
      await expect(page.locator(".chat-bubble-response")).toHaveText(
        /How can I assist you today?/,
      );
    });

    it("should have a form for the user to input messages", async () => {
      await expect(page.locator("form")).toBeVisible();
      await expect(page.getByRole("textbox")).toBeVisible();
    });

    afterAll(async () => {
      page.close();
    });
  });

  describe("initial query parameter", () => {
    let page: Page;
    const testQuery = "Do you have any locations available in downtown areas?";

    beforeAll(async () => {
      await prisma.user.deleteMany();
      page = await goto(`/chat?q=${encodeURIComponent(testQuery)}`);
    });

    it("handles initial query parameter", async () => {
      await expect(page.getByRole("textbox")).toHaveValue(testQuery);
    });

    afterAll(async () => {
      page.close();
    });
  });

  describe("exchange messages", () => {
    let page: Page;

    beforeAll(async () => {
      await prisma.user.deleteMany();
      page = await goto("/chat");
      await converse(
        page,
        "looking for a pop-up retail space for my clothing boutique",
      );
    });

    it("should look like a real chat", async () => {
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
      await expect(page.locator(".chat-bubble-response").last()).toBeVisible();
      const responseText = await page
        .locator(".chat-bubble-response")
        .last()
        .innerText();
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

    it("should store messages in database", async () => {
      const messages = await prisma.messages.findMany({
        orderBy: { createdAt: "asc" },
      });
      expect(messages.length).toBeGreaterThanOrEqual(3);
    });

    it("should store user message in database", async () => {
      const messages = await prisma.messages.findMany({
        orderBy: { createdAt: "asc" },
      });
      expect(messages.find((m) => m.role === "user")).toBeDefined();
    });

    it("should store assistant message in database", async () => {
      const messages = await prisma.messages.findMany({
        orderBy: { createdAt: "asc" },
      });
      expect(messages.find((m) => m.role === "assistant")).toBeDefined();
    });

    it("should create one chat session", async () => {
      const chats = await prisma.chat.findMany();
      expect(chats.length).toEqual(1);
      expect(chats[0].activeStreamId).toBeNull(); // Stream should be complete
    });

    it("should create an anonymous user", async () => {
      const users = await prisma.user.findMany();
      expect(users.length).toEqual(1);
      expect(users[0].isAnonymous).toBe(true);
    });
  });
});

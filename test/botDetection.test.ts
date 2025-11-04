import { expect, type Page } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import prisma from "~/lib/prisma";
import converse from "./helpers/converse";
import { goto } from "./helpers/launchBrowser";

describe("Bot detection", () => {
  describe("default browser", () => {
    let page: Page;

    beforeAll(async () => {
      await prisma.user.deleteMany();

      page = await goto("/chat", {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      });
      await converse(page, "Hello, how are you?");
    });

    it("should not be considered a bot", async () => {
      const users = await prisma.user.findMany();
      expect(users.length, "should have one user").toEqual(1);
      expect(users[0].isBot, "user should not be considered a bot").toBe(false);
    });

    afterAll(async () => {
      await page.close();
    });
  });

  describe("browser with bot User-Agent", () => {
    let page: Page;

    beforeAll(async () => {
      await prisma.user.deleteMany();

      page = await goto("/chat", {
        "user-agent": "vercel-screenshot/1.0",
      });
      await converse(page, "Hello, how are you?");
    });

    it("should be considered a bot", async () => {
      const users = await prisma.user.findMany();
      expect(users.length, "should have one user").toEqual(1);
      expect(users[0].isBot, "user should be considered a bot").toBe(true);
    });

    afterAll(async () => {
      await page.close();
    });
  });

  describe("browser with bot IP", () => {
    let page: Page;

    beforeAll(async () => {
      await prisma.user.deleteMany();

      page = await goto("/chat", {
        "x-forwarded-for": "66.249.65.224",
      });
      await converse(page, "Hello, how are you?");
    });

    it("should be considered a bot", async () => {
      const users = await prisma.user.findMany();
      expect(users.length, "should have one user").toEqual(1);
      expect(users[0].isBot, "user should be considered a bot").toBe(true);
    });

    afterAll(async () => {
      await page.close();
    });
  });
});

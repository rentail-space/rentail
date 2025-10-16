import { expect } from "playwright/test";
import { beforeEach, describe, it } from "vitest";
import prisma from "~/lib/prisma";
import { goto, launchBrowser } from "~/test/helpers/launchBrowser";

describe("Bot detection", () => {
  describe("default browser", () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await goto("/chat");
    });

    it("should not be considered a bot", async () => {
      const users = await prisma.user.findMany();
      expect(users.length, "should have one user").toEqual(1);
      expect(users[0].isBot, "user should not be considered a bot").toBe(false);
    });
  });

  describe("browser with bot User-Agent", () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await goto("/chat", {
        "user-agent": "vercel-screenshot/1.0",
      });
    });

    it("should be considered a bot", async () => {
      const users = await prisma.user.findMany();
      expect(users.length, "should have one user").toEqual(1);
      expect(users[0].isBot, "user should be considered a bot").toBe(true);
    });
  });

  describe("browser with bot IP", () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      await goto("/chat", {
        "x-forwarded-for": "66.249.65.224",
      });
    });

    it("should be considered a bot", async () => {
      const users = await prisma.user.findMany();
      expect(users.length, "should have one user").toEqual(1);
      expect(users[0].isBot, "user should be considered a bot").toBe(true);
    });
  });

  describe("two different bot requests without shared cookies link to the same user record", () => {
    beforeEach(async () => {
      await prisma.user.deleteMany();
      const context = await launchBrowser();

      // First bot request
      await goto("/chat", { "user-agent": "vercel-screenshot/1.0" });

      // Clear all cookies before the second bot request
      await context.clearCookies();
      await goto("/chat", { "user-agent": "vercel-screenshot/1.0" });
    });

    it("should create only one user", async () => {
      const users = await prisma.user.findMany();
      expect(users.length, "should have one user").toEqual(1);
    });

    it("should have the user considered a bot", async () => {
      const users = await prisma.user.findMany();
      expect(users[0].isBot, "user should be considered a bot").toBe(true);
    });
  });
});

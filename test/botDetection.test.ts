import { expect } from "playwright/test";
import { beforeEach, describe, it } from "vitest";
import prisma from "~/lib/prisma";
import converse from "./helpers/converse";
import { goto } from "./helpers/launchBrowser";

describe("Bot detection", () => {
  describe("default browser", () => {
    beforeEach(async () => {
      await visit({
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      });
    });

    it("should not be considered a bot", async () => {
      const users = await prisma.user.findMany();
      expect(users.length, "should have one user").toEqual(1);
      expect(users[0].isBot, "user should not be considered a bot").toBe(false);
    });
  });

  describe("browser with bot User-Agent", () => {
    beforeEach(async () => {
      await visit({ "user-agent": "vercel-screenshot/1.0" });
    });

    it("should be considered a bot", async () => {
      const users = await prisma.user.findMany();
      expect(users.length, "should have one user").toEqual(1);
      expect(users[0].isBot, "user should be considered a bot").toBe(true);
    });
  });

  describe("browser with bot IP", () => {
    beforeEach(async () => {
      await visit({ "x-forwarded-for": "66.249.65.224" });
    });

    it("should be considered a bot", async () => {
      const users = await prisma.user.findMany();
      expect(users.length, "should have one user").toEqual(1);
      expect(users[0].isBot, "user should be considered a bot").toBe(true);
    });
  });
});

async function visit(headers?: HeadersInit) {
  await prisma.user.deleteMany();
  const page = await goto("/chat", headers);
  await converse(page, "Hello, how are you?");
}

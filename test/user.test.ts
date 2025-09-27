import type { MastraMessageV2 } from "@mastra/core";
import type { TextUIPart } from "ai";
import type { Chat, User } from "prisma/generated/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type zod from "zod";
import prisma from "~/lib/prisma";
import {
  getRecentMessages,
  getWorkingMemory,
  type userProfile,
} from "~/lib/workingMemory";
import { launchServer, URL } from "./helpers/launchBrowser";

describe("User, conversation, profile", () => {
  let server: { port: number; stop: () => boolean };
  let response: Response;

  beforeAll(async () => {
    server = await launchServer();
    response = await fetch(`${URL}/chat`, {
      method: "GET",
    });
  });

  it("should respond with 200", async () => {
    expect(response.status).toBe(200);
  });

  describe("session", () => {
    let session: { userId: string; chatId: string };

    beforeAll(async () => {
      session = getSession();
    });

    it("should include session cookie", async () => {
      expect(session).toBeDefined();
    });

    it("should include user id", async () => {
      expect(session.userId).toBeDefined();
      await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });
    });

    it("should include chat id", async () => {
      expect(session.chatId).toBeDefined();
      await prisma.chat.findUniqueOrThrow({ where: { id: session.chatId } });
    });
  });

  describe("user", () => {
    let user: User;

    beforeAll(async () => {
      const session = getSession();
      user = await prisma.user.findUniqueOrThrow({
        where: { id: session.userId },
      });
    });

    it("should have IP address", async () => {
      expect(user.ip).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
    });

    describe("location", () => {
      let location: {
        city: string;
        state: string;
        country: string;
        latitude: string;
        longitude: string;
        timeZone: string;
      };

      beforeAll(async () => {
        location = user.location as typeof location;
      });

      it("should have city", async () => {
        expect(location.city).toEqual("Mountain View");
      });

      it("should have state", async () => {
        expect(location.state).toEqual("California");
      });

      it("should have country", async () => {
        expect(location.country).toEqual("United States");
      });

      it("should have latitude", async () => {
        expect(location.latitude).toEqual("37.42240");
      });

      it("should have longitude", async () => {
        expect(location.longitude).toEqual("-122.08421");
      });

      it("should have time zone", async () => {
        expect(location.timeZone).toEqual("America/Los_Angeles");
      });
    });
  });

  describe("chat", () => {
    let chat: Chat;
    let session: { userId: string; chatId: string };

    beforeAll(async () => {
      session = getSession();
      chat = await prisma.chat.findUniqueOrThrow({
        where: { id: session.chatId },
      });
    });

    it("should reference the user", async () => {
      expect(chat.userId).toBeDefined();
      expect(chat.userId).toEqual(session.userId);
    });
  });

  describe("working memory", () => {
    let workingMemory: zod.infer<typeof userProfile>;

    beforeAll(async () => {
      const session = getSession();
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: session.userId },
      });
      const chat = await prisma.chat.findUniqueOrThrow({
        where: { id: session.chatId },
      });
      workingMemory = await getWorkingMemory(user, chat);
    });

    it("should have user city", async () => {
      expect(workingMemory.location?.city).toEqual("Mountain View");
    });

    it("should have user state", async () => {
      expect(workingMemory.location?.state).toEqual("California");
    });

    it("should have user country", async () => {
      expect(workingMemory.location?.country).toEqual("United States");
    });

    it("should have user latitude", async () => {
      expect(workingMemory.location?.latitude).toEqual("37.42240");
    });

    it("should have user longitude", async () => {
      expect(workingMemory.location?.longitude).toEqual("-122.08421");
    });

    it("should have user time zone", async () => {
      expect(workingMemory.location?.timeZone).toEqual("America/Los_Angeles");
    });

    it("should not know user name", async () => {
      expect(workingMemory.name).toEqual("Unknown");
    });
  });

  describe("recent messages", () => {
    let messages: MastraMessageV2[];

    beforeAll(async () => {
      const session = getSession();
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: session.userId },
      });
      const chat = await prisma.chat.findUniqueOrThrow({
        where: { id: session.chatId },
      });
      messages = await getRecentMessages(user, chat);
    });

    it("should have one message", async () => {
      expect(messages.length).toBe(1);
    });

    it("should have an assistant message", async () => {
      expect(messages[0].role).toEqual("assistant");
    });

    it("should have a text part", async () => {
      expect(messages[0].content.parts[0].type).toEqual("text");
    });

    it("should ask user a question", async () => {
      const part = messages[0].content.parts[0] as TextUIPart;
      expect(part.text).toContain("Welcome to **rentail.space**!");
      expect(part.text).toContain(
        "I'm your virtual assistant here to help you find the perfect retail space for your business needs.",
      );
      expect(part.text).toContain("How can I assist you today?");
    });
  });

  function getSession() {
    const header = response.headers.get("Set-Cookie") || "";
    const cookies = new Map(
      header
        .split(", ")
        .map((cookie) => cookie.split(";")[0])
        .map((cookie) => cookie.split("="))
        .filter((parts): parts is [string, string] => parts.length === 2),
    );
    const value = cookies.get("__session") || "";
    const decoded = atob(decodeURIComponent(value.split(".")[0]));
    return JSON.parse(decoded);
  }

  afterAll(() => {
    server.stop();
  });
});

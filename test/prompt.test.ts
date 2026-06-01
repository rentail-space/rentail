import type { User } from "prisma/generated";
import { beforeAll, describe, expect, it } from "vitest";
import { createAnonymousUser } from "~/lib/sessions.server";
import { ulid } from "ulid";
import preparePrompt from "~/lib/preparePrompt.server";
import invariant from "tiny-invariant";

describe("prompt()", () => {
  let prompt: string;
  let user: User;

  describe("user in Los Angeles", () => {
    beforeAll(async () => {
      user = await createAnonymousUser({
        chatId: ulid(),
        requestHeaders: new Headers({
          "x-real-ip": "127.0.0.1",
          "x-ip-city": "Los%20Angeles",
          "x-ip-latitude": "34.04351",
          "x-ip-longitude": "-118.26365",
        }),
      });
      prompt = (
        await preparePrompt({
          headers: new Headers(),
          user,
        })
      )
        // Replace all single newlines with space, but keep double newlines
        .replace(/([^\n])\n([^\n])/g, "$1 $2");
    });

    it("includes clear instructions", () => {
      expect(prompt).toContain(
        "You are the virtual assistant that helps merchants looking for short-term retail spaces to lease in shopping centers and malls.",
      );
      expect(prompt).toContain(
        "You help merchants find space that's best fit for their needs.",
      );
    });

    it("includes current date and time", () => {
      // Extract date from prompt (format: YYYY-MM-DD)
      const dateMatch = /date is (\d{4}-\d{2}-\d{2})/.exec(prompt);
      expect(dateMatch?.[1]).toEqual("2026-01-15");
    });

    it("includes current time", () => {
      // Extract time from prompt (format: HH:MM:SS)
      const timeMatch = /time is (\d{2}:\d{2}:\d{2})/.exec(prompt);
      expect(timeMatch?.[1]).toEqual("12:00:00");
    });

    it("includes user profile schema", () => {
      const objects = parseJSON(prompt);
      const merchant = objects.find((object) => "merchant" in object);
      expect(merchant).toMatchObject({
        merchant: {
          name: "The merchant's name",
          phoneNumber: "Merchant's phone number",
          email: "Merchant's email address",
          hasRetailExperience:
            "Whether merchant has past experience as retailer at shopping centers",
        },
        location: {
          city: "The merchant's city",
          state: "The merchant's state",
          country: "The merchant's country",
        },
      });
    });

    it("includes shopping centers", () => {
      const theGrove = findTheGrove(prompt);
      expect(theGrove).toMatchObject({
        name: "The Grove",
        address: "189 The Grove Drive",
        city: "Los Angeles",
        state: "CA",
        url: "https://rentail.space/center/ca-the-grove",
      });
    });

    it("includes spaces in shopping centers", () => {
      const theGrove = findTheGrove(prompt);
      invariant(theGrove, "The Grove not found");
      const spaces = Array.isArray(theGrove.spaces) ? theGrove.spaces : [];
      const space = spaces.find(
        (space: { id: string }) => space.id === "jzfi2vjakvteoqmrxzcucivq",
      );
      expect(space).toBeUndefined();
    });

    it("includes instructions about known shopping centers only", () => {
      expect(prompt).toContain(
        "These are the best shopping centers near the user",
      );
      expect(prompt).toContain("You only know about these centers");
      expect(prompt).toContain(
        "Do not make up information about shopping centers you do not know about",
      );
    });
  });

  describe("unknown location", () => {
    let result: string;
    beforeAll(async () => {
      const user = await createAnonymousUser({
        chatId: ulid(),
        requestHeaders: new Headers({}),
      });
      result = await preparePrompt({
        headers: new Headers({}),
        user,
      });
    });

    it("should not include shopping centers", () => {
      const objects = parseJSON(result);
      const centers = objects.filter((object) => "address" in object);
      expect(centers).toHaveLength(0);
    });

    it("should instruct to ask user for location", () => {
      expect(result).toContain("Ask the user where are they looking for?");
    });
  });
});

function findTheGrove(markdown: string): Record<string, unknown> | undefined {
  const centers = parseJSON(markdown);
  return centers.find(
    (center) => (center as { name: string }).name === "The Grove",
  );
}

function parseJSON(markdown: string): Record<string, unknown>[] {
  const objects = findTopLevelJsonObjects(markdown);
  const centers = objects
    .map((object) => {
      try {
        return JSON.parse(object);
      } catch {
        return undefined;
      }
    })
    .filter(Boolean);
  return centers;
}

function findTopLevelJsonObjects(markdown: string): string[] {
  const objects: string[] = [];
  const len = markdown.length;
  let i = 0;
  while (i < len) {
    // Look for opening brace
    if (markdown[i] === "{") {
      let stack = 1;
      let j = i + 1;
      for (; j < len; j++) {
        if (markdown[j] === "{") stack++;
        else if (markdown[j] === "}") stack--;
        if (stack === 0) break;
      }
      if (stack === 0) {
        // Check for preceding whitespace/comment
        const objStr = markdown.slice(i, j + 1);
        objects.push(objStr);
        i = j + 1;
        continue;
      }
    }
    i++;
  }
  return objects;
}

import { invariant } from "node_modules/es-toolkit/dist/util/invariant.mjs";
import type { User } from "prisma/generated/client";
import { ulid } from "ulid";
import { beforeAll, describe, expect, it } from "vitest";
import preparePrompt from "~/lib/preparePrompt";
import { createAnonymousUser } from "~/lib/sessions.server";
import chatPrompt from "~/prompts/chatPrompt.md?raw";

describe("prompt()", () => {
  let prompt: string;
  let user: User;

  beforeAll(async () => {
    user = await createAnonymousUser({
      chatId: ulid(),
      requestHeaders: new Headers(),
    });
    prompt = await preparePrompt({
      headers: new Headers(),
      prompt: chatPrompt,
      user,
    });
  });

  it("includes clear instructions", () => {
    expect(prompt).toContain(
      "You are a virtual assistant for a specialty leasing retail space service",
    );
    expect(prompt).toContain(
      "You help merchants find the retail space that's best for their needs",
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
    const json = prompt.match(/```json\n(.*?)\n```/ms)?.[1];
    invariant(json, "JSON match not found");
    const parsed = JSON.parse(json);
    expect(parsed).toMatchObject({
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
      website: "https://thegrovela.com",
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

  describe("empty centers list", () => {
    let result: string;
    beforeAll(async () => {
      const user = await createAnonymousUser({
        chatId: ulid(),
        requestHeaders: new Headers({
          "x-real-ip": "127.0.0.1",
          "x-vercel-ip-city": "Los Angeles",
          "x-vercel-ip-latitude": "37.42240",
          "x-vercel-ip-longitude": "-122.08421",
        }),
      });
      result = await preparePrompt({
        headers: new Headers(),
        prompt: chatPrompt,
        user,
      });
    });

    it("includes instructions about empty centers list", () => {
      expect(result).toContain(
        "I don't know where you are, so I can't find any shopping centers near you",
      );
    });

    it("should not include shopping centers", () => {
      expect(result).not.toContain("<shopping-center>");
    });
  });

  it("includes instructions about known shopping centers only", () => {
    expect(prompt).toContain("within 20 miles of the user");
    expect(prompt).toContain(
      "These are all the shopping centers you know about",
    );
    expect(prompt).toContain(
      "You do not know about any other shopping centers",
    );
    expect(prompt).toContain(
      "Do not make up information about shopping centers you do not know about",
    );
  });
});

function findTheGrove(markdown: string): Record<string, unknown> | undefined {
  const centers = parseShoppingCenters(markdown);
  return centers.find(
    (center) => (center as { name: string }).name === "The Grove",
  );
}

function parseShoppingCenters(markdown: string): Record<string, unknown>[] {
  const shoppingCentersRegex = /<shopping-center>(.*?)<\/shopping-center>/gims;
  const matches = markdown.match(shoppingCentersRegex);
  invariant(matches, "No shopping centers found");
  return matches.map((center) => {
    const content = center.replace(/<\/?shopping-center>/gm, "");
    const spacesRegex = /<space>(.*?)<\/space>/gims;
    const spaces = content
      .match(spacesRegex)
      ?.map((space) => parseNameValuePairs(space));
    const props = parseNameValuePairs(content.replace(spacesRegex, ""));
    return { ...props, spaces };
  });
}

function parseNameValuePairs(str: string): Record<string, string | number> {
  const result: Record<string, string | number> = {};

  for (const line of str.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Find the colon separator
    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) continue;

    // Extract key (remove quotes and trim) and convert to camelCase
    const rawKey = trimmed.slice(0, colonIndex).trim();
    const key = rawKey
      .replace(/^"|"$/g, "")
      .toLowerCase()
      .split(" ")
      .map((word, idx) =>
        idx === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
      )
      .join("");

    // Extract value (remove quotes and trim)
    const rawValue = trimmed.slice(colonIndex + 1).trim();
    const value = rawValue.replace(/^"|"$/g, "");

    // Try parsing as number
    if (/^-?\d+\.?\d*$/.test(value)) result[key] = Number(value);
    else result[key] = value;
  }
  return result;
}

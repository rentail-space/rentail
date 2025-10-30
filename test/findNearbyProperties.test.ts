import { expect } from "playwright/test";
import type { PropertyGetPayload } from "prisma/generated/models";
import { beforeAll, describe, it } from "vitest";
import findNearbyProperties from "~/lib/findNearbyProperties";
import prisma from "~/lib/prisma";
import { goto } from "./helpers/launchBrowser";

describe("Proximity-based shopping center search", () => {
  describe("Search from 10 miles north", () => {
    let properties: PropertyGetPayload<{ include: { spaces: true } }>[];

    beforeAll(async () => {
      await identifyUser(calculateCoordinates("north", 10));

      const chat = await prisma.chat.findFirstOrThrow({
        include: { user: true },
      });
      properties = await findNearbyProperties({ chat, maxDistance: 20 });
    });

    it("should find The Grove shopping center", () => {
      expect(findTheGrove(properties)).toBeDefined();
    });
  });

  describe("Search from 10 miles south", () => {
    let properties: PropertyGetPayload<{ include: { spaces: true } }>[];

    beforeAll(async () => {
      await identifyUser(calculateCoordinates("south", 10));
      const chat = await prisma.chat.findFirstOrThrow({
        include: { user: true },
      });
      properties = await findNearbyProperties({ chat, maxDistance: 20 });
    });

    it("should find The Grove shopping center", () => {
      expect(findTheGrove(properties)).toBeDefined();
    });
  });

  describe("Search from 10 miles west", () => {
    let properties: PropertyGetPayload<{ include: { spaces: true } }>[];

    beforeAll(async () => {
      await identifyUser(calculateCoordinates("west", 10));
      const chat = await prisma.chat.findFirstOrThrow({
        include: { user: true },
      });
      properties = await findNearbyProperties({ chat, maxDistance: 20 });
    });

    it("should find The Grove shopping center", () => {
      expect(findTheGrove(properties)).toBeDefined();
    });
  });

  describe("Search from 10 miles east", () => {
    let properties: PropertyGetPayload<{ include: { spaces: true } }>[];

    beforeAll(async () => {
      await identifyUser(calculateCoordinates("east", 10));
      const chat = await prisma.chat.findFirstOrThrow({
        include: { user: true },
      });
      properties = await findNearbyProperties({ chat, maxDistance: 20 });
    });

    it("should find The Grove shopping center", () => {
      expect(findTheGrove(properties)).toBeDefined();
    });
  });

  describe("Search from 30 miles north", () => {
    let properties: PropertyGetPayload<{ include: { spaces: true } }>[];

    beforeAll(async () => {
      await identifyUser(calculateCoordinates("north", 30));
      const chat = await prisma.chat.findFirstOrThrow({
        include: { user: true },
      });
      properties = await findNearbyProperties({ chat, maxDistance: 20 });
    });

    it("should not find The Grove shopping center", () => {
      expect(findTheGrove(properties)).toBeUndefined();
    });
  });

  describe("Search from 30 miles south", () => {
    let properties: PropertyGetPayload<{ include: { spaces: true } }>[];

    beforeAll(async () => {
      await identifyUser(calculateCoordinates("south", 30));
      const chat = await prisma.chat.findFirstOrThrow({
        include: { user: true },
      });
      properties = await findNearbyProperties({ chat, maxDistance: 20 });
    });

    it("should not find The Grove shopping center", () => {
      expect(findTheGrove(properties)).toBeUndefined();
    });
  });

  describe("Search from 30 miles west", () => {
    let properties: PropertyGetPayload<{ include: { spaces: true } }>[];

    beforeAll(async () => {
      await identifyUser(calculateCoordinates("west", 30));
      const chat = await prisma.chat.findFirstOrThrow({
        include: { user: true },
      });
      properties = await findNearbyProperties({ chat, maxDistance: 20 });
    });

    it("should not find The Grove shopping center", () => {
      expect(findTheGrove(properties)).toBeUndefined();
    });
  });

  describe("Search from 30 miles east", () => {
    let properties: PropertyGetPayload<{ include: { spaces: true } }>[];

    beforeAll(async () => {
      await identifyUser(calculateCoordinates("east", 30));
      const chat = await prisma.chat.findFirstOrThrow({
        include: { user: true },
      });
      properties = await findNearbyProperties({ chat, maxDistance: 20 });
    });

    it("should not find The Grove shopping center", () => {
      expect(findTheGrove(properties)).toBeUndefined();
    });
  });
});

/**
 *  Helper to calculate coordinates at distance from The Grove
 * 1 degree latitude = 69.172 miles
 * 1 degree longitude at 34°N = 57.393 miles
 */
function calculateCoordinates(
  direction: "north" | "south" | "east" | "west",
  miles: number,
): { latitude: number; longitude: number } {
  // The Grove coordinates: -118.357674, 34.071972
  let latitude = 34.071972;
  let longitude = -118.357674;

  switch (direction) {
    case "north":
      latitude += miles / 69.172;
      break;
    case "south":
      latitude -= miles / 69.172;
      break;
    case "east":
      longitude += miles / 57.393;
      break;
    case "west":
      longitude -= miles / 57.393;
      break;
  }

  return { latitude, longitude };
}

async function identifyUser(coordinates: {
  latitude: number;
  longitude: number;
}) {
  await prisma.user.deleteMany();
  const page = await goto("/chat", {
    "x-vercel-ip-latitude": coordinates.latitude.toString(),
    "x-vercel-ip-longitude": coordinates.longitude.toString(),
  });
  await page.getByRole("textbox").fill("What are the nearby shopping centers?");
  await page.getByRole("button", { name: "Send" }).click();
  await page.waitForLoadState("networkidle");
}

function findTheGrove(
  properties: PropertyGetPayload<{ include: { spaces: true } }>[],
) {
  return properties.find((property) => property.name === "The Grove");
}

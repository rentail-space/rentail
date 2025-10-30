import { expect } from "playwright/test";
import type { Property } from "prisma/generated/client";
import { beforeAll, describe, it } from "vitest";
import findNearbyProperties from "~/lib/findNearbyProperties";
import prisma from "~/lib/prisma";
import converse from "./helpers/converse";

describe("Proximity-based shopping center search", () => {
  describe("Search from 10 miles north", () => {
    let properties: Property[];

    beforeAll(async () => {
      properties = await identifyUser(calculateCoordinates("north", 10));
    });

    it("should find The Grove shopping center", () => {
      expect(findTheGrove(properties)).toBeDefined();
    });
  });

  describe("Search from 10 miles south", () => {
    let properties: Property[];

    beforeAll(async () => {
      properties = await identifyUser(calculateCoordinates("south", 10));
    });

    it("should find The Grove shopping center", () => {
      expect(findTheGrove(properties)).toBeDefined();
    });
  });

  describe("Search from 10 miles west", () => {
    let properties: Property[];

    beforeAll(async () => {
      properties = await identifyUser(calculateCoordinates("west", 10));
    });

    it("should find The Grove shopping center", () => {
      expect(findTheGrove(properties)).toBeDefined();
    });
  });

  describe("Search from 10 miles east", () => {
    let properties: Property[];

    beforeAll(async () => {
      properties = await identifyUser(calculateCoordinates("east", 10));
    });

    it("should find The Grove shopping center", () => {
      expect(findTheGrove(properties)).toBeDefined();
    });
  });

  describe("Search from 30 miles north", () => {
    let properties: Property[];

    beforeAll(async () => {
      properties = await identifyUser(calculateCoordinates("north", 30));
    });

    it("should not find The Grove shopping center", () => {
      expect(findTheGrove(properties)).toBeUndefined();
    });
  });

  describe("Search from 30 miles south", () => {
    let properties: Property[];

    beforeAll(async () => {
      properties = await identifyUser(calculateCoordinates("south", 30));
    });

    it("should not find The Grove shopping center", () => {
      expect(findTheGrove(properties)).toBeUndefined();
    });
  });

  describe("Search from 30 miles west", () => {
    let properties: Property[];

    beforeAll(async () => {
      properties = await identifyUser(calculateCoordinates("west", 30));
    });

    it("should not find The Grove shopping center", () => {
      expect(findTheGrove(properties)).toBeUndefined();
    });
  });

  describe("Search from 30 miles east", () => {
    let properties: Property[];

    beforeAll(async () => {
      properties = await identifyUser(calculateCoordinates("east", 30));
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
}): Promise<Property[]> {
  await prisma.user.deleteMany();
  await converse("What are the nearby shopping centers?", {
    "x-vercel-ip-latitude": coordinates.latitude.toString(),
    "x-vercel-ip-longitude": coordinates.longitude.toString(),
  });

  const user = await prisma.user.findFirstOrThrow({ include: { chats: true } });
  const { properties } = await findNearbyProperties({
    chat: user.chats[0],
    maxDistance: 20,
    user,
  });
  return properties;
}

function findTheGrove(properties: Property[]) {
  return properties.find((property) => property.name === "The Grove");
}

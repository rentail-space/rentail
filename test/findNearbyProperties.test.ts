import { expect } from "playwright/test";
import type { PropertyGetPayload } from "prisma/generated/models";
import { beforeAll, beforeEach, describe, it } from "vitest";
import findNearbyProperties from "~/lib/findNearbyProperties";
import prisma from "~/lib/prisma";
import { goto } from "~/test/helpers/launchBrowser";

describe("Proximity-based shopping center search", () => {
  // Helper to calculate coordinates at distance from The Grove
  // 1 degree latitude = 69.172 miles
  // 1 degree longitude at 34°N = 57.393 miles
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

  function theGrove(
    properties: PropertyGetPayload<{ include: { spaces: true } }>[],
  ) {
    return properties.find((property) => property.name === "The Grove");
  }

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  describe("Search from 10 miles north", () => {
    let properties: PropertyGetPayload<{ include: { spaces: true } }>[];

    beforeAll(async () => {
      const { latitude, longitude } = calculateCoordinates("north", 10);
      await goto("/chat", {
        "x-vercel-ip-latitude": latitude.toString(),
        "x-vercel-ip-longitude": longitude.toString(),
      });
      const chat = await prisma.chat.findFirstOrThrow({
        include: { user: true },
      });
      properties = await findNearbyProperties({ chat, maxDistance: 20 });
    });

    it("should find The Grove shopping center", () => {
      expect(theGrove(properties)).toBeDefined();
    });
  });

  describe("Search from 10 miles south", () => {
    let properties: PropertyGetPayload<{ include: { spaces: true } }>[];

    beforeAll(async () => {
      await prisma.user.deleteMany();
      const { latitude, longitude } = calculateCoordinates("south", 10);
      await goto("/chat", {
        "x-forwarded-for": "146.70.195.183",
        "x-vercel-ip-latitude": latitude.toString(),
        "x-vercel-ip-longitude": longitude.toString(),
      });
      const chat = await prisma.chat.findFirstOrThrow({
        include: { user: true },
      });
      properties = await findNearbyProperties({ chat, maxDistance: 20 });
    });

    it("should find The Grove shopping center", () => {
      expect(theGrove(properties)).toBeDefined();
    });
  });

  describe("Search from 10 miles west", () => {
    let properties: PropertyGetPayload<{ include: { spaces: true } }>[];

    beforeAll(async () => {
      await prisma.user.deleteMany();
      const { latitude, longitude } = calculateCoordinates("west", 10);
      await goto("/chat", {
        "x-vercel-ip-latitude": latitude.toString(),
        "x-vercel-ip-longitude": longitude.toString(),
      });
      const chat = await prisma.chat.findFirstOrThrow({
        include: { user: true },
      });
      properties = await findNearbyProperties({ chat, maxDistance: 20 });
    });

    it("should find The Grove shopping center", () => {
      expect(theGrove(properties)).toBeDefined();
    });
  });

  describe("Search from 10 miles east", () => {
    let properties: PropertyGetPayload<{ include: { spaces: true } }>[];

    beforeAll(async () => {
      await prisma.user.deleteMany();
      const { latitude, longitude } = calculateCoordinates("east", 10);
      await goto("/chat", {
        "x-vercel-ip-latitude": latitude.toString(),
        "x-vercel-ip-longitude": longitude.toString(),
      });
      const chat = await prisma.chat.findFirstOrThrow({
        include: { user: true },
      });
      properties = await findNearbyProperties({ chat, maxDistance: 20 });
    });

    it("should find The Grove shopping center", () => {
      expect(theGrove(properties)).toBeDefined();
    });
  });

  describe("Search from 30 miles north", () => {
    let properties: PropertyGetPayload<{ include: { spaces: true } }>[];

    beforeAll(async () => {
      await prisma.user.deleteMany();
      const { latitude, longitude } = calculateCoordinates("north", 30);
      await goto("/chat", {
        "x-vercel-ip-latitude": latitude.toString(),
        "x-vercel-ip-longitude": longitude.toString(),
      });
      const chat = await prisma.chat.findFirstOrThrow({
        include: { user: true },
      });
      properties = await findNearbyProperties({ chat, maxDistance: 20 });
    });

    it("should not find The Grove shopping center", () => {
      expect(theGrove(properties)).toBeUndefined();
    });
  });

  describe("Search from 30 miles south", () => {
    let properties: PropertyGetPayload<{ include: { spaces: true } }>[];

    beforeAll(async () => {
      await prisma.user.deleteMany();
      const { latitude, longitude } = calculateCoordinates("south", 30);
      await goto("/chat", {
        "x-vercel-ip-latitude": latitude.toString(),
        "x-vercel-ip-longitude": longitude.toString(),
      });
      const chat = await prisma.chat.findFirstOrThrow({
        include: { user: true },
      });
      properties = await findNearbyProperties({ chat, maxDistance: 20 });
    });

    it("should not find The Grove shopping center", () => {
      expect(theGrove(properties)).toBeUndefined();
    });
  });

  describe("Search from 30 miles west", () => {
    let properties: PropertyGetPayload<{ include: { spaces: true } }>[];

    beforeAll(async () => {
      await prisma.user.deleteMany();
      const { latitude, longitude } = calculateCoordinates("west", 30);
      await goto("/chat", {
        "x-vercel-ip-latitude": latitude.toString(),
        "x-vercel-ip-longitude": longitude.toString(),
      });
      const chat = await prisma.chat.findFirstOrThrow({
        include: { user: true },
      });
      properties = await findNearbyProperties({ chat, maxDistance: 20 });
    });

    it("should not find The Grove shopping center", () => {
      expect(theGrove(properties)).toBeUndefined();
    });
  });

  describe("Search from 30 miles east", () => {
    let properties: PropertyGetPayload<{ include: { spaces: true } }>[];

    beforeAll(async () => {
      await prisma.user.deleteMany();
      const { latitude, longitude } = calculateCoordinates("east", 30);
      await goto("/chat", {
        "x-vercel-ip-latitude": latitude.toString(),
        "x-vercel-ip-longitude": longitude.toString(),
      });
      const chat = await prisma.chat.findFirstOrThrow({
        include: { user: true },
      });
      properties = await findNearbyProperties({ chat, maxDistance: 20 });
    });

    it("should not find The Grove shopping center", () => {
      expect(theGrove(properties)).toBeUndefined();
    });
  });
});

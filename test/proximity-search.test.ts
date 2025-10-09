import { expect } from "playwright/test";
import { beforeAll, describe, it } from "vitest";
import findNearbySpaces from "~/lib/findNearbySpaces";
import prisma from "~/lib/prisma";
import { goto } from "~/test/helpers/launchBrowser";

describe("Proximity-based shopping center search", () => {
  // The Grove coordinates: -118.357674, 34.071972
  const THE_GROVE_LAT = 34.071972;
  const THE_GROVE_LON = -118.357674;

  // Helper to calculate coordinates at distance from The Grove
  // 1 degree latitude = 69.172 miles
  // 1 degree longitude at 34°N = 57.393 miles
  function calculateCoordinates(
    direction: "north" | "south" | "east" | "west",
    miles: number,
  ): { latitude: string; longitude: string } {
    const LAT_MILES_PER_DEGREE = 69.172;
    const LON_MILES_PER_DEGREE = 57.393; // at 34°N

    let lat = THE_GROVE_LAT;
    let lon = THE_GROVE_LON;

    switch (direction) {
      case "north":
        lat += miles / LAT_MILES_PER_DEGREE;
        break;
      case "south":
        lat -= miles / LAT_MILES_PER_DEGREE;
        break;
      case "east":
        lon += miles / LON_MILES_PER_DEGREE;
        break;
      case "west":
        lon -= miles / LON_MILES_PER_DEGREE;
        break;
    }

    return {
      latitude: lat.toFixed(5),
      longitude: lon.toFixed(6),
    };
  }

  describe("Search from 10 miles north", () => {
    let result: string;

    beforeAll(async () => {
      const coords = calculateCoordinates("north", 10);
      await goto("/chat", {
        "x-forwarded-for": "146.70.195.182",
        "x-vercel-ip-city": "Test City",
        "x-vercel-ip-country": "United States",
        "x-vercel-ip-country-region": "California",
        "x-vercel-ip-timezone": "America/Los_Angeles",
        "x-vercel-ip-latitude": coords.latitude,
        "x-vercel-ip-longitude": coords.longitude,
      });

      const chat = await prisma.chat.findFirstOrThrow({
        include: { user: true },
      });
      result = await findNearbySpaces({ chat, maxDistance: 20 });
    });

    it("should find The Grove shopping center", () => {
      expect(result).toContain("The Grove");
    });
  });

  describe("Search from 10 miles south", () => {
    let result: string;

    beforeAll(async () => {
      await prisma.user.deleteMany();
      const coords = calculateCoordinates("south", 10);
      await goto("/chat", {
        "x-forwarded-for": "146.70.195.183",
        "x-vercel-ip-city": "Test City",
        "x-vercel-ip-country": "United States",
        "x-vercel-ip-country-region": "California",
        "x-vercel-ip-timezone": "America/Los_Angeles",
        "x-vercel-ip-latitude": coords.latitude,
        "x-vercel-ip-longitude": coords.longitude,
      });

      const chat = await prisma.chat.findFirstOrThrow({
        include: { user: true },
      });
      result = await findNearbySpaces({ chat, maxDistance: 20 });
    });

    it("should find The Grove shopping center", () => {
      expect(result).toContain("The Grove");
    });
  });

  describe("Search from 10 miles west", () => {
    let result: string;

    beforeAll(async () => {
      await prisma.user.deleteMany();
      const coords = calculateCoordinates("west", 10);
      await goto("/chat", {
        "x-forwarded-for": "146.70.195.184",
        "x-vercel-ip-city": "Test City",
        "x-vercel-ip-country": "United States",
        "x-vercel-ip-country-region": "California",
        "x-vercel-ip-timezone": "America/Los_Angeles",
        "x-vercel-ip-latitude": coords.latitude,
        "x-vercel-ip-longitude": coords.longitude,
      });

      const chat = await prisma.chat.findFirstOrThrow({
        include: { user: true },
      });
      result = await findNearbySpaces({ chat, maxDistance: 20 });
    });

    it("should find The Grove shopping center", () => {
      expect(result).toContain("The Grove");
    });
  });

  describe("Search from 10 miles east", () => {
    let result: string;

    beforeAll(async () => {
      await prisma.user.deleteMany();
      const coords = calculateCoordinates("east", 10);
      await goto("/chat", {
        "x-forwarded-for": "146.70.195.185",
        "x-vercel-ip-city": "Test City",
        "x-vercel-ip-country": "United States",
        "x-vercel-ip-country-region": "California",
        "x-vercel-ip-timezone": "America/Los_Angeles",
        "x-vercel-ip-latitude": coords.latitude,
        "x-vercel-ip-longitude": coords.longitude,
      });

      const chat = await prisma.chat.findFirstOrThrow({
        include: { user: true },
      });
      result = await findNearbySpaces({ chat, maxDistance: 20 });
    });

    it("should find The Grove shopping center", () => {
      expect(result).toContain("The Grove");
    });
  });

  describe("Search from 30 miles north", () => {
    let result: string;

    beforeAll(async () => {
      await prisma.user.deleteMany();
      const coords = calculateCoordinates("north", 30);
      await goto("/chat", {
        "x-forwarded-for": "146.70.195.186",
        "x-vercel-ip-city": "Test City",
        "x-vercel-ip-country": "United States",
        "x-vercel-ip-country-region": "California",
        "x-vercel-ip-timezone": "America/Los_Angeles",
        "x-vercel-ip-latitude": coords.latitude,
        "x-vercel-ip-longitude": coords.longitude,
      });

      const chat = await prisma.chat.findFirstOrThrow({
        include: { user: true },
      });
      result = await findNearbySpaces({ chat, maxDistance: 20 });
    });

    it("should not find The Grove shopping center", () => {
      expect(result).not.toContain("The Grove");
    });
  });

  describe("Search from 30 miles south", () => {
    let result: string;

    beforeAll(async () => {
      await prisma.user.deleteMany();
      const coords = calculateCoordinates("south", 30);
      await goto("/chat", {
        "x-forwarded-for": "146.70.195.187",
        "x-vercel-ip-city": "Test City",
        "x-vercel-ip-country": "United States",
        "x-vercel-ip-country-region": "California",
        "x-vercel-ip-timezone": "America/Los_Angeles",
        "x-vercel-ip-latitude": coords.latitude,
        "x-vercel-ip-longitude": coords.longitude,
      });

      const chat = await prisma.chat.findFirstOrThrow({
        include: { user: true },
      });
      result = await findNearbySpaces({ chat, maxDistance: 20 });
    });

    it("should not find The Grove shopping center", () => {
      expect(result).not.toContain("The Grove");
    });
  });

  describe("Search from 30 miles west", () => {
    let result: string;

    beforeAll(async () => {
      await prisma.user.deleteMany();
      const coords = calculateCoordinates("west", 30);
      await goto("/chat", {
        "x-forwarded-for": "146.70.195.188",
        "x-vercel-ip-city": "Test City",
        "x-vercel-ip-country": "United States",
        "x-vercel-ip-country-region": "California",
        "x-vercel-ip-timezone": "America/Los_Angeles",
        "x-vercel-ip-latitude": coords.latitude,
        "x-vercel-ip-longitude": coords.longitude,
      });

      const chat = await prisma.chat.findFirstOrThrow({
        include: { user: true },
      });
      result = await findNearbySpaces({ chat, maxDistance: 20 });
    });

    it("should not find The Grove shopping center", () => {
      expect(result).not.toContain("The Grove");
    });
  });

  describe("Search from 30 miles east", () => {
    let result: string;

    beforeAll(async () => {
      await prisma.user.deleteMany();
      const coords = calculateCoordinates("east", 30);
      await goto("/chat", {
        "x-forwarded-for": "146.70.195.189",
        "x-vercel-ip-city": "Test City",
        "x-vercel-ip-country": "United States",
        "x-vercel-ip-country-region": "California",
        "x-vercel-ip-timezone": "America/Los_Angeles",
        "x-vercel-ip-latitude": coords.latitude,
        "x-vercel-ip-longitude": coords.longitude,
      });

      const chat = await prisma.chat.findFirstOrThrow({
        include: { user: true },
      });
      result = await findNearbySpaces({ chat, maxDistance: 20 });
    });

    it("should not find The Grove shopping center", () => {
      expect(result).not.toContain("The Grove");
    });
  });
});

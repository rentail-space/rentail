import { expect } from "playwright/test";
import type { Property } from "prisma/generated/client";
import { beforeAll, describe, it } from "vitest";
import findNearbyProperties from "~/lib/findNearbyProperties";
import prisma from "~/lib/prisma";
import converse from "./helpers/converse";
import { goto } from "./helpers/launchBrowser";

const directions = ["north", "south", "east", "west"] as const;

describe("Proximity-based shopping center search", () => {
  for (const direction of directions) {
    describe(`Search from 10 miles ${direction}`, () => {
      let coordinates: { latitude: number; longitude: number };
      let properties: Property[];

      beforeAll(async () => {
        await prisma.user.deleteMany();
        coordinates = calculateCoordinates(direction, 10);
        properties = await findNearbyCoordinate(coordinates);
      });

      it(`should find The Grove shopping center ${direction}`, () => {
        const grove = properties.find(
          (property) => property.name === "The Grove",
        );
        expect(grove).toBeDefined();
      });
    });
  }

  for (const direction of directions) {
    describe(`Search from 30 miles ${direction}`, () => {
      let coordinates: { latitude: number; longitude: number };
      let properties: Property[];

      beforeAll(async () => {
        await prisma.user.deleteMany();
        coordinates = calculateCoordinates(direction, 30);
        properties = await findNearbyCoordinate(coordinates);
      });

      it(`should not find The Grove shopping center ${direction}`, () => {
        expect(properties.length).toEqual(0);
      });
    });
  }
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

async function findNearbyCoordinate(coordinates: {
  latitude: number;
  longitude: number;
}): Promise<Property[]> {
  const page = await goto("/chat", {
    "x-vercel-ip-latitude": coordinates.latitude.toString(),
    "x-vercel-ip-longitude": coordinates.longitude.toString(),
  });
  await converse(page, "What are the nearby shopping centers?");

  const user = await prisma.user.findFirstOrThrow();
  const properties = await findNearbyProperties({ maxDistance: 10, user });
  return properties;
}

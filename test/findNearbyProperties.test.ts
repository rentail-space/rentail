import { expect } from "playwright/test";
import type { Property } from "prisma/generated/client";
import { beforeAll, describe, it } from "vitest";
import findNearbyProperties from "~/lib/findNearbyProperties";
import prisma from "~/lib/prisma";

/**
 * NOTE:
 * 1 degree latitude = 69.172 miles
 * 1 degree longitude at 34°N = 57.393 miles
 */
describe("Proximity-based shopping center search", () => {
  let latitude: number;
  let longitude: number;

  beforeAll(async () => {
    const theGrove = await prisma.property.findFirstOrThrow({
      select: { latitude: true, longitude: true },
      where: { name: "The Grove" },
    });
    latitude = theGrove.latitude;
    longitude = theGrove.longitude;
  });

  describe("Search from 45 miles north", () => {
    let properties: Property[];

    beforeAll(async () => {
      properties = await createUserAndFind({
        latitude: latitude + 45 / 69.172,
        longitude,
      });
    });

    it("should find The Grove shopping center within 45 miles north", () => {
      expect(findTheGrove(properties)).toBeDefined();
    });
  });

  describe("Search from 45 miles south", () => {
    let properties: Property[];

    beforeAll(async () => {
      properties = await createUserAndFind({
        latitude: latitude - 45 / 69.172,
        longitude,
      });
    });

    it("should find The Grove shopping center within 45 miles south", () => {
      expect(findTheGrove(properties)).toBeDefined();
    });
  });

  describe("Search from 45 miles east", () => {
    let properties: Property[];

    beforeAll(async () => {
      properties = await createUserAndFind({
        latitude,
        longitude: longitude + 45 / 57.393,
      });
    });

    it("should find The Grove shopping center within 45 miles east", () => {
      expect(findTheGrove(properties)).toBeDefined();
    });
  });

  describe("Search from 45 miles west", () => {
    let properties: Property[];

    beforeAll(async () => {
      properties = await createUserAndFind({
        latitude,
        longitude: longitude - 45 / 57.393,
      });
    });

    it("should find The Grove shopping center within 45 miles west", () => {
      expect(findTheGrove(properties)).toBeDefined();
    });
  });

  describe("Search from 70 miles north", () => {
    let properties: Property[];

    beforeAll(async () => {
      properties = await createUserAndFind({
        latitude: latitude + 70 / 69.172,
        longitude,
      });
    });

    it("should not find The Grove shopping center beyond 70 miles north", () => {
      expect(findTheGrove(properties)).toBeUndefined();
    });
  });

  describe("Search from 70 miles south", () => {
    let properties: Property[];

    beforeAll(async () => {
      properties = await createUserAndFind({
        latitude: latitude - 70 / 69.172,
        longitude,
      });
    });

    it("should not find The Grove shopping center beyond 70 miles south", () => {
      expect(findTheGrove(properties)).toBeUndefined();
    });
  });

  describe("Search from 70 miles east", () => {
    let properties: Property[];

    beforeAll(async () => {
      properties = await createUserAndFind({
        latitude,
        longitude: longitude + 70 / 57.393,
      });
    });

    it("should not find The Grove shopping center beyond 70 miles east", () => {
      expect(findTheGrove(properties)).toBeUndefined();
    });
  });

  describe("Search from 70 miles west", () => {
    let properties: Property[];

    beforeAll(async () => {
      properties = await createUserAndFind({
        latitude,
        longitude: longitude - 70 / 57.393,
      });
    });

    it("should not find The Grove shopping center beyond 70 miles west", () => {
      expect(findTheGrove(properties)).toBeUndefined();
    });
  });
});

/**
 * Find nearby properties for a given location by directly creating a user
 * with the location in their working memory. This bypasses the AI chat flow
 * and tests the proximity search logic directly.
 */
async function createUserAndFind(coordinates: {
  latitude: number;
  longitude: number;
}): Promise<Property[]> {
  // Create a user with location already in working memory
  const user = await prisma.user.create({
    data: {
      id: `test-user-${Date.now()}`,
      geocode: {},
      metadata: {},
      workingMemory: JSON.stringify({
        location: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          city: "Los Angeles",
          state: "California",
          country: "USA",
          timeZone: "America/Los_Angeles",
        },
      }),
    },
  });

  const properties = await findNearbyProperties(user);

  // Clean up the test user
  await prisma.user.delete({ where: { id: user.id } });

  return properties;
}

function findTheGrove(properties: Property[]) {
  return properties.find((property) => property.name === "The Grove");
}

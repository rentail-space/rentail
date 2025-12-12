import { expect } from "playwright/test";
import type { Property } from "prisma/generated/client";
import { beforeAll, describe, it } from "vitest";
import findNearbyCenters from "~/lib/findNearbyCenters";
import prisma from "~/lib/prisma";
import { createAnonymousUser } from "~/lib/sessions.server";

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

  describe("Search from 30 miles north", () => {
    let centers: Property[];

    beforeAll(async () => {
      centers = await createUserAndFind({
        latitude: latitude + 30 / 69.172,
        longitude,
      });
    });

    it("should find The Grove shopping center within 30 miles north", () => {
      expect(findTheGrove(centers)).toBeDefined();
    });
  });

  describe("Search from 30 miles south", () => {
    let centers: Property[];

    beforeAll(async () => {
      centers = await createUserAndFind({
        latitude: latitude - 30 / 69.172,
        longitude,
      });
    });

    it("should find The Grove shopping center within 30 miles south", () => {
      expect(findTheGrove(centers)).toBeDefined();
    });
  });

  describe("Search from 30 miles east", () => {
    let centers: Property[];

    beforeAll(async () => {
      centers = await createUserAndFind({
        latitude,
        longitude: longitude + 30 / 57.393,
      });
    });

    it("should find The Grove shopping center within 30 miles east", () => {
      expect(findTheGrove(centers)).toBeDefined();
    });
  });

  describe("Search from 30 miles west", () => {
    let centers: Property[];

    beforeAll(async () => {
      centers = await createUserAndFind({
        latitude,
        longitude: longitude - 30 / 57.393,
      });
    });

    it("should find The Grove shopping center within 30 miles west", () => {
      expect(findTheGrove(centers)).toBeDefined();
    });
  });

  describe("Search from 70 miles north", () => {
    let centers: Property[];

    beforeAll(async () => {
      centers = await createUserAndFind({
        latitude: latitude + 70 / 69.172,
        longitude,
      });
    });

    it("should not find The Grove shopping center beyond 70 miles north", () => {
      expect(findTheGrove(centers)).toBeUndefined();
    });
  });

  describe("Search from 70 miles south", () => {
    let centers: Property[];

    beforeAll(async () => {
      centers = await createUserAndFind({
        latitude: latitude - 70 / 69.172,
        longitude,
      });
    });

    it("should not find The Grove shopping center beyond 70 miles south", () => {
      expect(findTheGrove(centers)).toBeUndefined();
    });
  });

  describe("Search from 70 miles east", () => {
    let centers: Property[];

    beforeAll(async () => {
      centers = await createUserAndFind({
        latitude,
        longitude: longitude + 70 / 57.393,
      });
    });

    it("should not find The Grove shopping center beyond 70 miles east", () => {
      expect(findTheGrove(centers)).toBeUndefined();
    });
  });

  describe("Search from 70 miles west", () => {
    let centers: Property[];

    beforeAll(async () => {
      centers = await createUserAndFind({
        latitude,
        longitude: longitude - 70 / 57.393,
      });
    });

    it("should not find The Grove shopping center beyond 70 miles west", () => {
      expect(findTheGrove(centers)).toBeUndefined();
    });
  });
});

/**
 * Find nearby centers for a given location by directly creating a user with the
 * location in their working memory. This bypasses the AI chat flow and tests
 * the proximity search logic directly.
 */
async function createUserAndFind(coordinates: {
  latitude: number;
  longitude: number;
}): Promise<Property[]> {
  // Create a user with location already in working memory
  const user = await createAnonymousUser({
    requestHeaders: new Headers({
      "x-real-ip": "127.0.0.1",
      "x-vercel-ip-city": "Los Angeles",
      "x-vercel-ip-latitude": coordinates.latitude.toString(),
      "x-vercel-ip-longitude": coordinates.longitude.toString(),
    }),
    chatId: `test-chat-${Date.now()}`,
  });

  const { centers } = await findNearbyCenters({
    headers: new Headers(),
    user,
  });
  return centers;
}

function findTheGrove(centers: Property[]) {
  return centers.find((center) => center.name === "The Grove");
}

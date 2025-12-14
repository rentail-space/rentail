import { existsSync } from "node:fs";
import { readFile, rm } from "node:fs/promises";
import { afterEach, describe, expect, it } from "vitest";
import { writeCenterFile } from "~/lib/writeCenterFile";

describe("writeCenterFile", () => {
  afterEach(async () => {
    await rm("prisma/seed/ca", { recursive: true, force: true });
  });

  it("writes center data to correct file path", async () => {
    const centerData = {
      name: "Test Center",
      state: "CA",
      city: "Los Angeles",
      country: "USA",
      address: "123 Test St",
      latitude: 34.05,
      longitude: -118.25,
      squareFootage: 100000,
      numberOfStores: 50,
      website: "https://test.com",
      imageURLs: [],
      description: "Test description",
      spaces: [],
    };

    const path = await writeCenterFile(centerData, "Los Angeles County");

    expect(existsSync(path)).toBe(true);
    expect(path).toContain("prisma/seed/ca/los-angeles");
    expect(path).toContain("ca-test-center.json");

    const content = await readFile(path, "utf-8");
    const parsed = JSON.parse(content);
    expect(parsed.name).toBe("Test Center");
  });
});

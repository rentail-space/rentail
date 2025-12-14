import { describe, expect, it } from "vitest";
import { discoverCenters } from "~/lib/discoverCenters";

describe("discoverCenters", () => {
  it.skip("returns structured center data for a county", async () => {
    // NOTE: This test requires real Anthropic API calls and is skipped in CI
    // Run manually with: tsx scripts/testDiscovery.ts
    const centers = await discoverCenters("Los Angeles County, CA");

    expect(Array.isArray(centers)).toBe(true);
    expect(centers.length).toBeGreaterThan(0);

    const first = centers[0];
    expect(first).toHaveProperty("name");
    expect(first).toHaveProperty("address");
    expect(first).toHaveProperty("city");
    expect(first).toHaveProperty("state");
    expect(first).toHaveProperty("website");
    expect(first).toHaveProperty("latitude");
    expect(first).toHaveProperty("longitude");
  });
});

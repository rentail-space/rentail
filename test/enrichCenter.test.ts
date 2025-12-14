import { describe, expect, it } from "vitest";
import enrichCenter from "~/lib/scrape/enrichCenter";

describe("enrichCenter", () => {
  it.skip("structures and validates center data", async () => {
    // Skipped: requires real Anthropic API calls
    // Manual verification via scripts/testEnrich.ts
    const discoveryData = {
      name: "Westfield Century City",
      address: "10250 Santa Monica Blvd",
      city: "Los Angeles",
      state: "CA",
      website: "https://www.westfield.com/centurycity",
      latitude: 34.0575,
      longitude: -118.4148,
    };

    const scrapedData = {
      bodyText: "Welcome to Westfield Century City. Phone: 310-277-3898",
      images: [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg",
      ],
      title: "Westfield Century City",
      description: "Premier shopping destination",
    };

    const result = await enrichCenter(discoveryData, scrapedData);

    expect(result).toHaveProperty("name");
    expect(result).toHaveProperty("address");
    expect(result).toHaveProperty("description");
    expect(result).toHaveProperty("imageURLs");
    expect(Array.isArray(result.imageURLs)).toBe(true);
  });
});

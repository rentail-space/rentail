import { describe, expect, it } from "vitest";
import scrapeCenter from "~/lib/scrape/scrapeCenter";

describe("scrapeCenter", () => {
  it("extracts content from a shopping center website", async () => {
    const url = "https://www.westfield.com/centurycity";
    const result = await scrapeCenter(url);

    expect(result).toHaveProperty("bodyText");
    expect(result).toHaveProperty("images");
    expect(result).toHaveProperty("title");
    expect(result.bodyText).toBeTruthy();
    expect(Array.isArray(result.images)).toBe(true);
  });

  it("handles scraping failures gracefully", async () => {
    const url = "https://invalid-url-that-does-not-exist-12345.com";
    const result = await scrapeCenter(url);

    expect(result.error).toBe("scraping_failed");
  });
});

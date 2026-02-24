import { describe, expect, it } from "vitest";
import { analyzeMention } from "~/lib/chatgpt-visibility/runAllQueries.server";

describe("analyzeMention", () => {
  it("returns mentioned=true and position when 'rentail' appears in prose", () => {
    const result = analyzeMention(
      "You should check out Rentail.space for short-term retail leasing.",
    );
    expect(result.mentioned).toBe(true);
    expect(result.position).toBeGreaterThanOrEqual(0);
  });

  it("returns mentioned=false and position=null when brand absent", () => {
    const result = analyzeMention(
      "You can find pop-up space on Storefront or Appear Here.",
    );
    expect(result.mentioned).toBe(false);
    expect(result.position).toBeNull();
  });

  it("is case-insensitive", () => {
    expect(analyzeMention("RENTAIL.SPACE is great").mentioned).toBe(true);
    expect(analyzeMention("rentail is listed").mentioned).toBe(true);
  });

  it("picks the earliest position when multiple keywords match", () => {
    const result = analyzeMention(
      "Visit rentail.space — rentail is the leading platform.",
    );
    expect(result.position).toBe(6); // index of "rentail.space"
  });
});

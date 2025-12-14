import { describe, expect, it } from "vitest";
import { generateSlug } from "~/lib/generateSlug";

describe("generateSlug", () => {
  it("generates slug from name and state", () => {
    expect(generateSlug("Westfield Century City", "CA")).toBe(
      "ca-westfield-century-city",
    );
  });

  it("removes special characters", () => {
    expect(generateSlug("Mall's & Shopping", "NY")).toBe("ny-malls-shopping");
  });

  it("collapses multiple hyphens", () => {
    expect(generateSlug("The   Great  Mall", "TX")).toBe("tx-the-great-mall");
  });

  it("trims leading/trailing hyphens", () => {
    expect(generateSlug("---Mall---", "CA")).toBe("ca-mall");
  });
});

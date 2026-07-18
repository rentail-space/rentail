import { describe, expect, test } from "vite-plus/test";
import normalizePhone from "~/lib/normalizePhone";

describe("normalizePhone", () => {
  test("strips non-digits and prepends a single + (E.164-ish)", () => {
    expect(normalizePhone("+1 310-854-0070")).toBe("+13108540070");
  });

  test("does not produce a double + prefix", () => {
    // Regression: the scraper used /D/g (literal "D") instead of /\D/g, so the
    // leading + was kept and a second + prepended, yielding "++1 310-854-0070".
    const result = normalizePhone("+1 310-854-0070");
    expect(result).not.toMatch(/^\+\+/);
    expect(result).toBe("+13108540070");
  });

  test("strips spaces, dashes, parens, dots, and a leading +", () => {
    expect(normalizePhone("+1 (310) 854-0070")).toBe("+13108540070");
    expect(normalizePhone("1.310.854.0070")).toBe("+13108540070");
    expect(normalizePhone("13108540070")).toBe("+13108540070");
  });

  test("strips a trailing extension so its digits are not merged in", () => {
    expect(normalizePhone("+1 714-687-0000 ext. 400")).toBe("+17146870000");
    expect(normalizePhone("+1 714-687-0000 ext 400")).toBe("+17146870000");
    expect(normalizePhone("+1 714-687-0000 x400")).toBe("+17146870000");
    expect(normalizePhone("+1 714-687-0000 x 400")).toBe("+17146870000");
    expect(normalizePhone("+17146870000ext400")).toBe("+17146870000");
    // Does not over-strip: a number with no extension is untouched.
    expect(normalizePhone("+1 310-854-0070")).toBe("+13108540070");
  });

  test("returns undefined when the phone is missing", () => {
    expect(normalizePhone(undefined)).toBeUndefined();
    expect(normalizePhone("")).toBeUndefined();
  });

  test("returns undefined when the input has no digits", () => {
    expect(normalizePhone("N/A")).toBeUndefined();
  });
});

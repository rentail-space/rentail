/**
 * Shared space types for scrapers.
 *
 * Derived from values instead of duplicated union types — adding a new
 * space type here automatically propagates to all consumers.
 */

const SPACE_TYPES = ["Cart", "Inline", "Storage", "Other"] as const;

/**
 * Valid space type values.
 */
export type SpaceType = (typeof SPACE_TYPES)[number];

/**
 * Runtime type guard for space types.
 *
 * Returns `true` and narrows the type when `value` is a known space type.
 * Use instead of unsafe `as "Cart" | "Inline" | "Storage"` casts.
 */
export function isSpaceType(value: string): value is SpaceType {
  return SPACE_TYPES.some((type) => type.toLowerCase() === value.toLowerCase());
}

/**
 * Normalize a scraped space type string to a known `SpaceType`.
 *
 * Handles case-insensitive matching and returns `undefined` for unknown values
 * (callers can fall back to `"Other"` or skip).
 */
export function normalizeSpaceType(value: string): SpaceType | undefined {
  return SPACE_TYPES.find(
    (type) => type.toLowerCase() === value.toLowerCase().trim(),
  );
}

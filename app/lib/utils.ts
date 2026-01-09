import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class values into a single class string.
 *
 * @param inputs - The class values to merge.
 * @returns The merged class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Pluralize a word based on the count. For example, "1 review" or "2 reviews".
 *
 * @param count - The count of the word.
 * @param singular - The singular form of the word.
 * @param plural - The plural form of the word.
 * @returns The pluralized word.
 */
export function pluralize(count: number, singular: string, plural: string) {
  return `${count.toLocaleString()} ${count === 1 ? singular : plural}`;
}

/**
 * Converts a time string to milliseconds.
 * Supports: ms (milliseconds), s (seconds), m (minutes), h (hours), d (days)
 *
 * @param timeStr - Time string like "5ms", "6m", "10s", "2h", "1d"
 * @returns Time in milliseconds
 *
 * @example
 * timeToMs("5ms") // 5
 * timeToMs("6m") // 360000
 * timeToMs("10s") // 10000
 * timeToMs("2h") // 7200000
 */
export function timeToMs(timeStr: string): number {
  const match = timeStr.match(/^(\d+(?:\.\d+)?)(ms|s|m|h|d)$/i);
  if (!match) {
    throw new Error(
      `Invalid time format: ${timeStr}. Expected format: "5ms", "6m", "10s", etc.`,
    );
  }

  const value = Number.parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return Math.round(value * multipliers[unit]);
}

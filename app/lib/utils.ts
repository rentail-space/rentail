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

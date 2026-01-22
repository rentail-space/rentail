import { clamp } from "es-toolkit";

/**
 * Converts a time in integer format to a time of day string in the format
 * "HH:MM AM/PM".  For example, 930 becomes "9:30 AM" and 2100 becomes "9:00
 * PM".
 *
 * @param time - The time to convert to a time of day string in integer format.
 * @returns The time of day string in the format "HH:MM AM/PM".
 */
export default function timeOfDay(time: number) {
  const hour = clamp(time / 100, 0, 23);
  const minute = clamp(time % 100, 0, 59);
  return `${hour % 12}:${minute.toString().padStart(2, "0")} ${hour > 12 ? "PM" : "AM"}`;
}

import { clamp } from "es-toolkit";

export default function timeOfDay(time: number) {
  const hour = clamp(time / 100, 0, 23);
  const minute = clamp(time % 100, 0, 59);
  return `${hour % 12}:${minute.toString().padStart(2, "0")} ${hour > 12 ? "PM" : "AM"}`;
}

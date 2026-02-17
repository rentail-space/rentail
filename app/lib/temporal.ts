import { Temporal } from "@js-temporal/polyfill";

const mediumDate = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
const fullDate = new Intl.DateTimeFormat("en-US", { dateStyle: "full" });
const datetimeFull = new Intl.DateTimeFormat("en-US", {
  dateStyle: "full",
  timeStyle: "long",
});

/** Equivalent to Luxon's DateTime.DATE_MED format */
export function formatDateMed(date: Date): string {
  return mediumDate.format(date);
}

/** Equivalent to Luxon's DateTime.DATE_HUGE format */
export function formatDateHuge(date: Date): string {
  return fullDate.format(date);
}

/** Equivalent to Luxon's DateTime.DATETIME_FULL format */
export function formatDatetimeFull(date: Date): string {
  return datetimeFull.format(date);
}

/** Get a JS Date N days ago (UTC) */
export function daysAgo(days: number): Date {
  return new Date(
    Temporal.Now.zonedDateTimeISO("UTC").subtract({ days }).epochMilliseconds,
  );
}

import { describe, expect, test } from "vite-plus/test";
import {
  dateRange,
  duration,
  humanDate,
  parseDuration,
  timeago,
} from "~/lib/time";

describe("timeago", () => {
  const ref = 1704067200000; // 2024-01-01 00:00:00 UTC

  test("just now - 0 seconds", () => {
    expect(timeago(ref, ref)).toBe("just now");
  });

  test("just now - 30 seconds", () => {
    expect(timeago(ref - 30_000, ref)).toBe("just now");
  });

  test("just now - 44 seconds", () => {
    expect(timeago(ref - 44_000, ref)).toBe("just now");
  });

  test("1 minute ago - 45 seconds", () => {
    expect(timeago(ref - 45_000, ref)).toBe("1 minute ago");
  });

  test("1 minute ago - 89 seconds", () => {
    expect(timeago(ref - 89_000, ref)).toBe("1 minute ago");
  });

  test("2 minutes ago - 90 seconds", () => {
    expect(timeago(ref - 90_000, ref)).toBe("2 minutes ago");
  });

  test("2 minutes ago - 150 seconds", () => {
    expect(timeago(ref - 150_000, ref)).toBe("3 minutes ago");
  });

  test("44 minutes ago", () => {
    expect(timeago(ref - 44 * 60 * 1000, ref)).toBe("44 minutes ago");
  });

  test("1 hour ago - 45 minutes", () => {
    expect(timeago(ref - 45 * 60 * 1000, ref)).toBe("1 hour ago");
  });

  test("1 hour ago - 89 minutes", () => {
    expect(timeago(ref - 89 * 60 * 1000, ref)).toBe("1 hour ago");
  });

  test("2 hours ago - 90 minutes", () => {
    expect(timeago(ref - 90 * 60 * 1000, ref)).toBe("2 hours ago");
  });

  test("21 hours ago", () => {
    expect(timeago(ref - 21 * 3600 * 1000, ref)).toBe("21 hours ago");
  });

  test("1 day ago - 22 hours", () => {
    expect(timeago(ref - 22 * 3600 * 1000, ref)).toBe("1 day ago");
  });

  test("1 day ago - 35 hours", () => {
    expect(timeago(ref - 35 * 3600 * 1000, ref)).toBe("1 day ago");
  });

  test("2 days ago - 36 hours", () => {
    expect(timeago(ref - 36 * 3600 * 1000, ref)).toBe("2 days ago");
  });

  test("25 days ago", () => {
    expect(timeago(ref - 25 * 86400 * 1000, ref)).toBe("25 days ago");
  });

  test("1 month ago - 26 days", () => {
    expect(timeago(ref - 26 * 86400 * 1000, ref)).toBe("1 month ago");
  });

  test("1 month ago - 45 days", () => {
    expect(timeago(ref - 45 * 86400 * 1000, ref)).toBe("1 month ago");
  });

  test("2 months ago - 46 days", () => {
    expect(timeago(ref - 46 * 86400 * 1000, ref)).toBe("2 months ago");
  });

  test("10 months ago - 319 days", () => {
    expect(timeago(ref - 319 * 86400 * 1000, ref)).toBe("10 months ago");
  });

  test("1 year ago - 320 days", () => {
    expect(timeago(ref - 320 * 86400 * 1000, ref)).toBe("1 year ago");
  });

  test("1 year ago - 547 days", () => {
    expect(timeago(ref - 547 * 86400 * 1000, ref)).toBe("1 year ago");
  });

  test("2 years ago - 548 days", () => {
    expect(timeago(ref - 548 * 86400 * 1000, ref)).toBe("2 years ago");
  });

  test("5 years ago", () => {
    expect(timeago(ref - 5 * 365 * 86400 * 1000, ref)).toBe("5 years ago");
  });

  // Future times
  test("in 1 minute - 45 seconds", () => {
    expect(timeago(ref + 45_000, ref)).toBe("in 1 minute");
  });

  test("in 2 minutes - 90 seconds", () => {
    expect(timeago(ref + 90_000, ref)).toBe("in 2 minutes");
  });

  test("in 1 hour", () => {
    expect(timeago(ref + 3600_000, ref)).toBe("in 1 hour");
  });

  test("in 2 hours", () => {
    expect(timeago(ref + 2 * 3600 * 1000, ref)).toBe("in 2 hours");
  });

  test("in 1 day", () => {
    expect(timeago(ref + 22 * 3600 * 1000, ref)).toBe("in 1 day");
  });

  test("in 2 days", () => {
    expect(timeago(ref + 36 * 3600 * 1000, ref)).toBe("in 2 days");
  });

  test("in 1 month", () => {
    expect(timeago(ref + 26 * 86400 * 1000, ref)).toBe("in 1 month");
  });

  test("in 1 year", () => {
    expect(timeago(ref + 320 * 86400 * 1000, ref)).toBe("in 1 year");
  });

  // Default reference (no second argument)
  test("default reference returns just now", () => {
    expect(timeago(Date.now())).toBe("just now");
  });
});

describe("duration", () => {
  test("0 seconds", () => {
    expect(duration(0)).toBe("0 seconds");
  });

  test("1 second", () => {
    expect(duration(1 * 1000)).toBe("1 second");
  });

  test("45 seconds", () => {
    expect(duration(45 * 1000)).toBe("45 seconds");
  });

  test("1 minute", () => {
    expect(duration(60 * 1000)).toBe("1 minute");
  });

  test("1 minute 30 seconds", () => {
    expect(duration(90 * 1000)).toBe("1 minute, 30 seconds");
  });

  test("2 minutes", () => {
    expect(duration(120 * 1000)).toBe("2 minutes");
  });

  test("1 hour", () => {
    expect(duration(3600 * 1000)).toBe("1 hour");
  });

  test("1 hour 1 minute", () => {
    expect(duration(3661 * 1000)).toBe("1 hour, 1 minute");
  });

  test("1 hour 1 minute 1 second - max_units default", () => {
    expect(duration(3661 * 1000)).toBe("1 hour, 1 minute");
  });

  test("2 hours 30 minutes", () => {
    expect(duration(9000 * 1000)).toBe("2 hours, 30 minutes");
  });

  test("1 day", () => {
    expect(duration(86400 * 1000)).toBe("1 day");
  });

  test("1 day 2 hours", () => {
    expect(duration(93600 * 1000)).toBe("1 day, 2 hours");
  });

  test("30 days", () => {
    expect(duration(30 * 86400 * 1000)).toBe("1 month");
  });

  test("365 days", () => {
    expect(duration(365 * 86400 * 1000)).toBe("1 year");
  });

  test("1 year 6 months", () => {
    expect(duration(365 * 86400 * 1000 + 180 * 86400 * 1000)).toBe(
      "1 year, 6 months",
    );
  });

  // Compact mode
  test("compact - 90 seconds", () => {
    expect(duration(90 * 1000, { compact: true })).toBe("1m 30s");
  });

  test("compact - 1 hour 1 minute", () => {
    expect(duration(3661 * 1000, { compact: true })).toBe("1h 1m");
  });

  test("compact - 2 hours 30 minutes", () => {
    expect(duration(9000 * 1000, { compact: true })).toBe("2h 30m");
  });

  test("compact - 1 day 2 hours", () => {
    expect(duration(93600 * 1000, { compact: true })).toBe("1d 2h");
  });

  test("compact - 45 seconds", () => {
    expect(duration(45 * 1000, { compact: true })).toBe("45s");
  });

  // max_units
  test("max_units 1 - 3661 seconds", () => {
    expect(duration(3661 * 1000, { max_units: 1 })).toBe("1 hour");
  });

  test("max_units 1 - 9000 seconds", () => {
    expect(duration(9000 * 1000, { max_units: 1 })).toBe("3 hours");
  });

  test("max_units 3 - complex duration", () => {
    expect(duration(93661 * 1000, { max_units: 3 })).toBe(
      "1 day, 2 hours, 1 minute",
    );
  });

  test("compact and max_units 1", () => {
    expect(duration(3661 * 1000, { compact: true, max_units: 1 })).toBe("1h");
  });

  // Error cases
  test("negative seconds throws", () => {
    expect(() => duration(-1)).toThrow();
  });

  test("NaN throws", () => {
    expect(() => duration(Number.NaN)).toThrow();
  });

  test("Infinity throws", () => {
    expect(() => duration(Number.POSITIVE_INFINITY)).toThrow();
  });
});

describe("parseDuration", () => {
  // Compact format
  test("2h", () => {
    expect(parseDuration("2h")).toBe(2 * 3600 * 1000);
  });

  test("2h30m", () => {
    expect(parseDuration("2h30m")).toBe(9000 * 1000);
  });

  test("2h 30m", () => {
    expect(parseDuration("2h 30m")).toBe(9000 * 1000);
  });

  test("2h, 30m", () => {
    expect(parseDuration("2h, 30m")).toBe(9000 * 1000);
  });

  test("90m", () => {
    expect(parseDuration("90m")).toBe(5400 * 1000);
  });

  test("90s", () => {
    expect(parseDuration("90s")).toBe(90 * 1000);
  });

  test("1d", () => {
    expect(parseDuration("1d")).toBe(86400 * 1000);
  });

  test("1w", () => {
    expect(parseDuration("1w")).toBe(604800 * 1000);
  });

  // Verbose format
  test("2 hours", () => {
    expect(parseDuration("2 hours")).toBe(2 * 3600 * 1000);
  });

  test("2 hours 30 minutes", () => {
    expect(parseDuration("2 hours 30 minutes")).toBe(9000 * 1000);
  });

  test("2 hours and 30 minutes", () => {
    expect(parseDuration("2 hours and 30 minutes")).toBe(9000 * 1000);
  });

  test("90 minutes", () => {
    expect(parseDuration("90 minutes")).toBe(5400 * 1000);
  });

  test("1 day", () => {
    expect(parseDuration("1 day")).toBe(86400 * 1000);
  });

  test("1 week", () => {
    expect(parseDuration("1 week")).toBe(604800 * 1000);
  });

  // Decimal
  test("2.5 hours", () => {
    expect(parseDuration("2.5 hours")).toBe(9000 * 1000);
  });

  test("1.5h", () => {
    expect(parseDuration("1.5h")).toBe(5400 * 1000);
  });

  test("0.5d", () => {
    expect(parseDuration("0.5d")).toBe(43200 * 1000);
  });

  // Colon notation
  test("2:30", () => {
    expect(parseDuration("2:30")).toBe(9000 * 1000);
  });

  test("2:30:00", () => {
    expect(parseDuration("2:30:00")).toBe(9000 * 1000);
  });

  test("0:45", () => {
    expect(parseDuration("0:45")).toBe(2700 * 1000);
  });

  test("1:00:00", () => {
    expect(parseDuration("1:00:00")).toBe(3600 * 1000);
  });

  // Unit aliases
  test("2hr", () => {
    expect(parseDuration("2hr")).toBe(2 * 3600 * 1000);
  });

  test("2hrs", () => {
    expect(parseDuration("2hrs")).toBe(2 * 3600 * 1000);
  });

  test("2 hour", () => {
    expect(parseDuration("2 hour")).toBe(2 * 3600 * 1000);
  });

  test("30min", () => {
    expect(parseDuration("30min")).toBe(1800 * 1000);
  });

  test("30mins", () => {
    expect(parseDuration("30mins")).toBe(1800 * 1000);
  });

  test("30 minute", () => {
    expect(parseDuration("30 minute")).toBe(1800 * 1000);
  });

  test("45sec", () => {
    expect(parseDuration("45sec")).toBe(45 * 1000);
  });

  test("45secs", () => {
    expect(parseDuration("45secs")).toBe(45 * 1000);
  });

  test("45 second", () => {
    expect(parseDuration("45 second")).toBe(45 * 1000);
  });

  test("45 seconds", () => {
    expect(parseDuration("45 seconds")).toBe(45 * 1000);
  });

  test("2wk", () => {
    expect(parseDuration("2wk")).toBe(1209600 * 1000);
  });

  test("2wks", () => {
    expect(parseDuration("2wks")).toBe(1209600 * 1000);
  });

  test("2 weeks", () => {
    expect(parseDuration("2 weeks")).toBe(1209600 * 1000);
  });

  // Complex combinations
  test("1d 2h 30m", () => {
    expect(parseDuration("1d 2h 30m")).toBe(95400 * 1000);
  });

  test("1 day 2 hours 30 minutes", () => {
    expect(parseDuration("1 day 2 hours 30 minutes")).toBe(95400 * 1000);
  });

  test("1w 2d", () => {
    expect(parseDuration("1w 2d")).toBe(777600 * 1000);
  });

  // Error cases
  test("empty string throws", () => {
    expect(() => parseDuration("")).toThrow();
  });

  test("invalid string throws", () => {
    expect(() => parseDuration("invalid")).toThrow();
  });

  test("negative value throws", () => {
    expect(() => parseDuration("-1h")).toThrow();
  });

  test("no units throws", () => {
    expect(() => parseDuration("123")).toThrow();
  });
});

describe("humanDate", () => {
  // Using 2024-01-15 Monday 12:00:00 UTC as reference
  const ref = 1705320000000;

  test("today", () => {
    expect(humanDate(ref, ref)).toBe("Today");
  });

  test("today - earlier same day", () => {
    expect(humanDate(ref - 3600_000, ref)).toBe("Today");
  });

  test("yesterday", () => {
    expect(humanDate(ref - 86400_000, ref)).toBe("Yesterday");
  });

  test("tomorrow", () => {
    expect(humanDate(ref + 86400_000, ref)).toBe("Tomorrow");
  });

  test("last Sunday - 1 day ago", () => {
    expect(humanDate(ref - 86400_000, ref)).toBe("Yesterday"); // Sunday
  });

  test("last Saturday - 2 days ago", () => {
    expect(humanDate(ref - 2 * 86400_000, ref)).toBe("Last Saturday");
  });

  test("last Friday - 3 days ago", () => {
    expect(humanDate(ref - 3 * 86400_000, ref)).toBe("Last Friday");
  });

  test("last Monday - 7 days ago", () => {
    expect(humanDate(ref - 7 * 86400_000, ref)).toBe("Last Monday");
  });

  test("this Tuesday - 1 day from now", () => {
    expect(humanDate(ref + 86400_000, ref)).toBe("Tomorrow"); // Tuesday
  });

  test("this Wednesday - 2 days from now", () => {
    expect(humanDate(ref + 2 * 86400_000, ref)).toBe("This Wednesday");
  });

  test("this Sunday - 6 days from now", () => {
    expect(humanDate(ref + 6 * 86400_000, ref)).toBe("This Sunday");
  });

  test("same year - January 5", () => {
    const jan5 = 1704456000000; // 2024-01-05
    expect(humanDate(jan5, ref)).toBe("January 5");
  });

  test("same year - March 20", () => {
    const mar20 = 1710892800000; // 2024-03-20
    expect(humanDate(mar20, ref)).toBe("March 20");
  });

  test("same year - December 25", () => {
    const dec25 = 1735084800000; // 2024-12-25
    expect(humanDate(dec25, ref)).toBe("December 25");
  });

  test("different year - future", () => {
    const jan1_2025 = 1735689600000; // 2025-01-01
    expect(humanDate(jan1_2025, ref)).toBe("January 1, 2025");
  });

  test("different year - past", () => {
    const jan1_2023 = 1672531200000; // 2023-01-01
    expect(humanDate(jan1_2023, ref)).toBe("January 1, 2023");
  });

  test("default reference", () => {
    // Should use same timestamp as reference
    expect(humanDate(ref)).toBe("Today");
  });
});

describe("dateRange", () => {
  test("same day", () => {
    const mar5 = 1709596800000; // 2024-03-05
    expect(dateRange(mar5, mar5)).toBe("March 5, 2024");
  });

  test("same month - March 5-7", () => {
    const mar5 = 1709596800000; // 2024-03-05
    const mar7 = 1709769600000; // 2024-03-07
    expect(dateRange(mar5, mar7)).toBe("March 5–7, 2024");
  });

  test("same month - March 1-31", () => {
    const mar1 = 1709251200000; // 2024-03-01
    const mar31 = 1711843200000; // 2024-03-31
    expect(dateRange(mar1, mar31)).toBe("March 1–31, 2024");
  });

  test("same year - March 5 to April 7", () => {
    const mar5 = 1709596800000; // 2024-03-05
    const apr7 = 1712448000000; // 2024-04-07
    expect(dateRange(mar5, apr7)).toBe("March 5 – April 7, 2024");
  });

  test("same year - January to December", () => {
    const jan1 = 1704067200000; // 2024-01-01
    const dec31 = 1735603200000; // 2024-12-31
    expect(dateRange(jan1, dec31)).toBe("January 1 – December 31, 2024");
  });

  test("different years - December 28, 2024 to January 3, 2025", () => {
    const dec28 = 1735344000000; // 2024-12-28
    const jan3 = 1735862400000; // 2025-01-03
    expect(dateRange(dec28, jan3)).toBe("December 28, 2024 – January 3, 2025");
  });

  test("different years - March 2023 to March 2024", () => {
    const mar2023 = 1677628800000; // 2023-03-01
    const mar2024 = 1709251200000; // 2024-03-01
    expect(dateRange(mar2023, mar2024)).toBe("March 1, 2023 – March 1, 2024");
  });

  test("swapped dates - end before start", () => {
    const mar5 = 1709596800000; // 2024-03-05
    const mar7 = 1709769600000; // 2024-03-07
    // Should swap them silently
    expect(dateRange(mar7, mar5)).toBe("March 5–7, 2024");
  });
});

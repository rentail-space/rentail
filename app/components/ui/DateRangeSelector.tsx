import { Temporal } from "@js-temporal/polyfill";
import { useCallback, useState } from "react";

export const PERIODS = [14, 30, 90];

function getToday() {
  return Temporal.Now.plainDateISO("UTC");
}

/**
 * Client-side hook for reading the current date range.
 * Each caller gets its own independent state (no shared context).
 * For syncing data across components, pass values as props.
 */
export function useRangeSelection() {
  const today = getToday();
  const [period, setPeriod] = useState(PERIODS[1]);
  const from = today.subtract({ days: period });
  const setRange = useCallback(
    (from: Temporal.PlainDate, until: Temporal.PlainDate) => {
      const diff = from.until(until, {
        largestUnit: "day",
        smallestUnit: "day",
      });
      setPeriod(Math.floor(diff.total("hours") / 24));
    },
    [],
  );
  return { from, period, today, until: today, setRange };
}

/**
 * Server-side utility to parse date range from URL search params.
 * Does NOT use React state or hooks — safe to call in loaders.
 */
export function parseDateRange(searchParams: URLSearchParams): {
  from: Temporal.PlainDate;
  period: number;
  until: Temporal.PlainDate;
  today: Temporal.PlainDate;
} {
  const today = getToday();

  let until: Temporal.PlainDate;
  try {
    until = Temporal.PlainDate.from(searchParams.get("until") ?? "");
  } catch {
    until = today;
  }

  let from: Temporal.PlainDate;
  try {
    from = Temporal.PlainDate.from(searchParams.get("from") ?? "");
  } catch {
    from = today.subtract({ days: PERIODS[1] });
  }

  const todayDate = today.toString();
  const untilDate = until.toString();
  const period =
    untilDate === todayDate
      ? Math.floor(
          from
            .until(until, { largestUnit: "day", smallestUnit: "day" })
            .total("hours") / 24,
        )
      : PERIODS[1];

  return { from, period, today, until };
}

export default function DateRangeSelector({
  period,
  onPeriodChange,
}: {
  period?: number;
  onPeriodChange?: (period: number) => void;
}) {
  const activePeriod = period ?? PERIODS[1];

  if (!PERIODS.length) return null;

  return (
    <div className="inline-flex items-center justify-center gap-2 rounded-base border-2 border-black bg-[hsl(60,100%,99%)] p-2 shadow-[2px_2px_0px_0px_black]">
      {PERIODS.map((daysInPeriod) => {
        const isActive = activePeriod === daysInPeriod;
        return (
          <button
            key={daysInPeriod}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-base border-2 px-4 py-2 font-bold text-sm transition-all duration-100 ${
              isActive
                ? "border-black bg-[hsl(37,92%,65%)] shadow-[2px_2px_0px_0px_black]"
                : "border-transparent text-black hover:border-black hover:bg-white"
            }`}
            onClick={() => {
              if (onPeriodChange) onPeriodChange(daysInPeriod);
            }}
            title={`Select the last ${daysInPeriod} days`}
          >
            Last {daysInPeriod} Days
          </button>
        );
      })}
    </div>
  );
}

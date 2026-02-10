import { DateTime } from "luxon";
import { useSearchParams } from "react-router";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/Tabs";

/**
 * These are the time periods user can tab through.
 */
const periods = [14, 30, 90];

/**
 * A hook that returns the start and end dates and a function to set the range.
 * The start and end dates are parsed from the search params. The function to
 * set the range is used to update the search params and can be used with
 * useTransition in client. Can be used with useSearchParams in client,
 * URLSearchParams in server.
 *
 * @example
 * const { from, until, period, today, setRange } = useRangeSelection();
 * setRange(today.minus({ days: 14 }), today);
 *
 * @returns The start and end dates and a function to set the range and the today's date.
 */
export function useRangeSelection(): {
  from: DateTime<boolean>;
  period: number;
  setRange: (from: DateTime, until: DateTime) => void;
  today: DateTime<boolean>;
  until: DateTime<boolean>;
} {
  const [searchParams, setSearchParams] = useSearchParams();
  const { from, period, until, today } = parseDateRange(searchParams);
  const setRange = (from: DateTime, until: DateTime) => {
    setSearchParams(
      (params) => {
        params.set("from", from.toISODate() ?? "");
        params.set("until", until.toISODate() ?? "");
        return params;
      },
      { replace: true, viewTransition: true },
    );
  };
  return { from, until, period, today, setRange };
}

/**
 * Parses the start and end dates and the today's date from the search params.
 * Can be used with URLSearchParams in server.
 *
 * @example
 * const { from, until, today } = parseDateRange(new URL(request.url).searchParams);
 * @param searchParams - The search params to parse the dates from.
 * @returns The start and end dates and the today's date.
 */
export function parseDateRange(searchParams: URLSearchParams): {
  from: DateTime;
  period: number;
  until: DateTime;
  today: DateTime;
} {
  const today = DateTime.utc();
  const until = DateTime.fromISO(searchParams.get("until") ?? "")
    .setZone("utc")
    .startOf("day");
  const from = DateTime.fromISO(searchParams.get("from") ?? "")
    .setZone("utc")
    .startOf("day");
  const period =
    until.toISODate() === today.toISODate()
      ? Math.floor(today.diff(from, "days").days)
      : periods[1];
  return {
    from: from.isValid
      ? from
      : today.minus({ days: periods[1] }).startOf("day"),
    period,
    today,
    until: until.isValid ? until : today.startOf("day"),
  };
}

/**
 * A component that allows the user to select a range of dates. Can be used with
 * useRangeSelection in client, URLSearchParams in server.
 *
 * @returns The component that allows the user to select a range of dates.
 */
export default function DateRangeSelector() {
  const { period, today, setRange } = useRangeSelection();
  return (
    <Tabs
      value={period}
      onValueChange={(value) => {
        setRange(today.minus({ days: Number(value) }), today);
      }}
    >
      <TabsList>
        {periods.map((daysInPeriod) => (
          <TabsTrigger
            key={daysInPeriod}
            value={daysInPeriod}
            title={`Select the last ${daysInPeriod} days`}
          >
            Last {daysInPeriod} Days
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

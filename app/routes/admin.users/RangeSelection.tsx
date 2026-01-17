import { invariant } from "es-toolkit";
import { ArrowRight, MoveLeft, MoveRight } from "lucide-react";
import { DateTime } from "luxon";
import { useQueryState } from "nuqs";
import type { User } from "prisma/generated/client";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/Tabs";
import type { loader } from "./route";
import { da, ta } from "zod/v4/locales";

/**
 * These are the time periods user can tab through: 10 days, 30 days (5 ticks),
 * and 90 days (15 ticks).
 */
const periods = [10, 5 * 6, 15 * 6];

/**
 * A component that allows the user to select a range of dates.  It will call
 * the children components with the range of dates and the recent users.
 *
 * @param analytics - The analytics data.
 * @param children - A function that will be called with the range of dates and
 * the recent users.
 * @param users - The users data.
 * @returns The children components.
 */
export default function RangeSelection({
  analytics,
  children,
  users,
}: {
  analytics: Awaited<ReturnType<typeof loader>>["analytics"];
  children: ({
    range,
    recentUsers,
    analytics,
  }: {
    range: [DateTime, DateTime];
    recentUsers: User[];
    analytics: Awaited<ReturnType<typeof loader>>["analytics"];
    selector: React.ReactNode;
  }) => React.ReactNode;
  users: User[];
}) {
  invariant(children instanceof Function, "children must be a function");

  const [from, setFrom] = useQueryState("from", {
    defaultValue: DateTime.utc()
      .minus({ days: periods[1] })
      .toFormat("yyyy-MM-dd"),
    history: "replace",
  });
  const [until, setUntil] = useQueryState("until", {
    defaultValue: DateTime.utc().minus({ days: 1 }).toFormat("yyyy-MM-dd"),
    history: "replace",
  });

  const startOf = DateTime.fromISO(from, { zone: "utc" }).startOf("day");
  const endOf = DateTime.fromISO(until, { zone: "utc" }).endOf("day");

  return children({
    analytics: analytics.filter(({ date }) => {
      const day = DateTime.fromFormat(date, "yyyyMMdd", {
        zone: "utc",
      }).startOf("day");
      return day >= startOf && day <= endOf;
    }),
    range: [startOf, endOf],
    recentUsers: users.filter(
      ({ createdAt, isAdmin }) =>
        createdAt >= startOf.toJSDate() &&
        createdAt <= endOf.toJSDate() &&
        !isAdmin,
    ),
    selector: (
      <RangeSelector
        from={from}
        setFrom={setFrom}
        setUntil={setUntil}
        until={until}
      />
    ),
  });
}

/**
 * Selects the range of dates to show in the chart.
 *
 * @param from The start date
 * @param setFrom Update the start date
 * @param setUntil Update the end date
 * @param until The end date
 */
function RangeSelector({
  from,
  setFrom,
  setUntil,
  until,
}: {
  from: string;
  setFrom: (from: string) => void;
  setUntil: (until: string) => void;
  until: string;
}) {
  const yesterday = DateTime.utc().minus({ days: 1 });
  // Difference in days between start date and end date, so we can highlight the
  // selected date range.
  const daysInPeriod =
    until === yesterday.toFormat("yyyy-MM-dd") &&
    Math.floor(
      DateTime.utc().diff(DateTime.fromISO(from, { zone: "utc" }), "days").days,
    );

  return (
    <div className="flex flex-row items-center justify-between">
      <Tabs value={daysInPeriod.toString()}>
        <TabsList>
          {periods.map((daysInPeriod) => (
            <TabsTrigger
              key={daysInPeriod}
              onClick={() => {
                setFrom(
                  DateTime.utc()
                    .minus({ days: daysInPeriod })
                    .toFormat("yyyy-MM-dd"),
                );
                setUntil(
                  DateTime.utc().minus({ days: 1 }).toFormat("yyyy-MM-dd"),
                );
              }}
              value={daysInPeriod.toString()}
              title={`Select the last ${daysInPeriod} days`}
            >
              Last {daysInPeriod} Days
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-row items-center gap-0">
        <Input
          className="w-36"
          onChange={({ target }) => setFrom(target.value)}
          type="date"
          value={from}
        />
        <ArrowRight className="h-8 w-8 text-gray-500" />
        <Input
          className="w-36"
          onChange={({ target }) => setUntil(target.value)}
          type="date"
          value={until}
        />
      </div>

      <div className="flex flex-row items-center gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setFrom(
              DateTime.fromFormat(from, "yyyy-MM-dd")
                .minus({ weeks: 1 })
                .toFormat("yyyy-MM-dd"),
            );
            setUntil(
              DateTime.fromFormat(until, "yyyy-MM-dd")
                .minus({ weeks: 1 })
                .toFormat("yyyy-MM-dd"),
            );
          }}
          title="Retreat the range by 1 week"
        >
          <MoveLeft className="h-10 w-10 text-gray-500" />
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setFrom(
              DateTime.fromFormat(from, "yyyy-MM-dd")
                .plus({ weeks: 1 })
                .toFormat("yyyy-MM-dd"),
            );
            setUntil(
              DateTime.fromFormat(until, "yyyy-MM-dd")
                .plus({ weeks: 1 })
                .toFormat("yyyy-MM-dd"),
            );
          }}
          title="Advance the range by 1 week"
        >
          <MoveRight className="h-10 w-10 text-gray-500" />
        </Button>
      </div>
    </div>
  );
}

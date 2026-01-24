import { ArrowRight, MoveLeft, MoveRight } from "lucide-react";
import { DateTime } from "luxon";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/Tabs";

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
  from,
  until,
  setFrom,
  setUntil,
}: {
  from: Date;
  until: Date;
  setFrom: (from: Date) => void;
  setUntil: (until: Date) => void;
}) {
  const yesterday = DateTime.utc().minus({ days: 1 });
  // Difference in days between start date and end date, so we can highlight the
  // selected date range.
  const daysInPeriod =
    until.toISOString().split("T")[0] === yesterday.toISO().split("T")[0] &&
    Math.floor(
      DateTime.utc().diff(
        DateTime.fromISO(from.toISOString().split("T")[0], { zone: "utc" }),
        "days",
      ).days,
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
                  DateTime.utc().minus({ days: daysInPeriod }).toJSDate(),
                );
                setUntil(DateTime.utc().minus({ days: 1 }).toJSDate());
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
          onChange={({ target }) => setFrom(new Date(target.value))}
          type="date"
          value={from.toISOString().split("T")[0]}
        />
        <ArrowRight className="h-8 w-8 text-gray-500" />
        <Input
          className="w-36"
          onChange={({ target }) => setUntil(new Date(target.value))}
          type="date"
          value={until.toISOString().split("T")[0]}
        />
      </div>

      <div className="flex flex-row items-center gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setFrom(
              DateTime.fromISO(from.toISOString().split("T")[0], {
                zone: "utc",
              })
                .minus({ weeks: 1 })
                .toJSDate(),
            );
            setUntil(
              DateTime.fromISO(until.toISOString().split("T")[0], {
                zone: "utc",
              })
                .minus({ weeks: 1 })
                .toJSDate(),
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
              DateTime.fromISO(from.toISOString().split("T")[0], {
                zone: "utc",
              })
                .plus({ weeks: 1 })
                .toJSDate(),
            );
            setUntil(
              DateTime.fromISO(until.toISOString().split("T")[0], {
                zone: "utc",
              })
                .plus({ weeks: 1 })
                .toJSDate(),
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

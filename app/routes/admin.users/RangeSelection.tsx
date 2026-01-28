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
 * @param from - The start date.
 * @param until - The end date.
 * @param setRange - A function that will be called with the start and end date.
 */
export default function RangeSelection({
  from,
  until,
  setRange,
}: {
  from: DateTime;
  until: DateTime;
  setRange: (from: DateTime, until: DateTime) => void;
}) {
  const yesterday = DateTime.utc().minus({ days: 1 });
  // Difference in days between start date and end date, so we can highlight the
  // selected date range.
  const daysInPeriod =
    until.toISODate() === yesterday.toISODate() &&
    Math.floor(DateTime.utc().diff(from, "days").days);

  return (
    <div className="flex flex-row items-center justify-between">
      <Tabs value={daysInPeriod.toString()}>
        <TabsList>
          {periods.map((daysInPeriod) => (
            <TabsTrigger
              key={daysInPeriod}
              onClick={() => {
                setRange(
                  DateTime.utc().minus({ days: daysInPeriod }),
                  DateTime.utc().minus({ days: 1 }),
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
          onChange={({ target }) =>
            setRange(DateTime.fromISO(target.value), until)
          }
          type="date"
          value={from.toISODate() ?? ""}
        />
        <ArrowRight className="h-8 w-8 text-gray-500" />
        <Input
          className="w-36"
          onChange={({ target }) =>
            setRange(from, DateTime.fromISO(target.value))
          }
          type="date"
          value={until.toISODate() ?? ""}
        />
      </div>

      <div className="flex flex-row items-center gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setRange(from.minus({ weeks: 1 }), until.minus({ weeks: 1 }));
          }}
          title="Retreat the range by 1 week"
        >
          <MoveLeft className="h-10 w-10 text-gray-500" />
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setRange(from.plus({ weeks: 1 }), until.plus({ weeks: 1 }));
          }}
          title="Advance the range by 1 week"
        >
          <MoveRight className="h-10 w-10 text-gray-500" />
        </Button>
      </div>
    </div>
  );
}

import { ArrowRight, MoveLeft, MoveRight } from "lucide-react";
import { DateTime } from "luxon";
import { useQueryState } from "nuqs";
import type { User } from "prisma/generated/client";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/Tabs";

export default function RangeSelection({
  analytics,
  children,
  users,
}: {
  analytics: Array<{
    activeUsers: number;
    averageSessionDuration: number;
    date: string;
    sessionSource: string;
  }>;
  children: (
    recentUsers: User[],
    analytics: Array<{
      activeUsers: number;
      averageSessionDuration: number;
      date: string;
      sessionSource: string;
    }>,
  ) => React.ReactNode;
  users: User[];
}) {
  const today = DateTime.now();
  const [from, setFrom] = useQueryState("from", {
    defaultValue: today.minus({ days: 30 }).toFormat("yyyy-MM-dd"),
    history: "replace",
  });
  const [until, setUntil] = useQueryState("until", {
    defaultValue: today.toFormat("yyyy-MM-dd"),
    history: "replace",
  });

  const start = DateTime.fromFormat(from, "yyyy-MM-dd")
    .startOf("day")
    .toJSDate();
  const end = DateTime.fromFormat(until, "yyyy-MM-dd").endOf("day").toJSDate();
  const recentUsers = users.filter(
    ({ createdAt, isAdmin }) =>
      createdAt >= start && createdAt <= end && !isAdmin,
  );

  return (
    <>
      <RangeSelector
        from={from}
        setFrom={setFrom}
        until={until}
        setUntil={setUntil}
      />
      {children(
        recentUsers,
        analytics.filter(({ date }) => {
          const day = DateTime.fromFormat(date, "yyyyMMdd")
            .startOf("day")
            .toJSDate();
          return day >= start && day <= end;
        }),
      )}
    </>
  );
}

function RangeSelector({
  from,
  setFrom,
  until,
  setUntil,
}: {
  from: string;
  setFrom: (from: string) => void;
  until: string;
  setUntil: (until: string) => void;
}) {
  const today = DateTime.now();
  const daysInPeriod =
    until === today.toFormat("yyyy-MM-dd") &&
    Math.floor(
      today.diff(DateTime.fromFormat(from, "yyyy-MM-dd"), "days").days,
    );

  return (
    <div className="flex flex-row items-center justify-between">
      <Tabs value={daysInPeriod.toString()}>
        <TabsList>
          {[10, 30, 90].map((daysInPeriod) => (
            <TabsTrigger
              key={daysInPeriod}
              onClick={() => {
                setFrom(
                  today.minus({ days: daysInPeriod }).toFormat("yyyy-MM-dd"),
                );
                setUntil(today.toFormat("yyyy-MM-dd"));
              }}
              value={daysInPeriod.toString()}
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
                .minus({ days: 1 })
                .toFormat("yyyy-MM-dd"),
            );
            setUntil(
              DateTime.fromFormat(until, "yyyy-MM-dd")
                .minus({ days: 1 })
                .toFormat("yyyy-MM-dd"),
            );
          }}
        >
          <MoveLeft className="h-10 w-10 text-gray-500" />
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setFrom(
              DateTime.fromFormat(from, "yyyy-MM-dd")
                .plus({ days: 1 })
                .toFormat("yyyy-MM-dd"),
            );
            setUntil(
              DateTime.fromFormat(until, "yyyy-MM-dd")
                .plus({ days: 1 })
                .toFormat("yyyy-MM-dd"),
            );
          }}
        >
          <MoveRight className="h-10 w-10 text-gray-500" />
        </Button>
      </div>
    </div>
  );
}

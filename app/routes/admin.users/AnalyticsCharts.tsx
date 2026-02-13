import { meanBy, sumBy } from "es-toolkit";
import {
  BotIcon,
  BubblesIcon,
  ClockIcon,
  PersonStandingIcon,
} from "lucide-react";
import { DateTime } from "luxon";
import type { User } from "prisma/generated/client";
import { Suspense } from "react";
import { Await } from "react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  type DataKey,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "~/components/ui/Card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/Chart";
import LoadingProgress from "~/components/ui/LoadingProgress";
import type { Analytics } from "./route";

const chartConfig = {
  visitors: {
    label: "Unique Visitors",
    icon: PersonStandingIcon,
    color: "var(--chart-1)",
    valueFormatter: (value: number) => value.toLocaleString(),
  },
  fromLLM: {
    label: "Visitors from LLM",
    icon: BotIcon,
    color: "var(--chart-2)",
    valueFormatter: (value: number) => value.toLocaleString(),
  },
  chats: {
    label: "Chats Started",
    icon: BubblesIcon,
    color: "var(--chart-3)",
    valueFormatter: (value: number) => value.toLocaleString(),
  },
  sessionDuration: {
    label: "Avg Session Duration",
    icon: ClockIcon,
    color: "var(--chart-4)",
    valueFormatter: (value: number) =>
      `${Math.floor(value / 60).toLocaleString()}m${Math.floor(value % 60)
        .toString()
        .padStart(2, "0")}s`,
  },
};

export default function AnalyticsCharts({
  analytics,
  from,
  until,
  users,
}: {
  analytics: Promise<Analytics[]>;
  from: DateTime;
  until: DateTime;
  users: User[];
}) {
  return (
    <Card className="bg-secondary-background text-foreground">
      <CardContent>
        <Suspense fallback={<LoadingProgress />}>
          <Await resolve={analytics}>
            {(analytics) => (
              <SquareAnalyticsCharts
                analytics={analytics}
                from={from}
                until={until}
                users={users}
              />
            )}
          </Await>
        </Suspense>
      </CardContent>
    </Card>
  );
}

function SquareAnalyticsCharts({
  analytics,
  from,
  until,
  users,
}: {
  analytics: Analytics[];
  from: DateTime;
  until: DateTime;
  users: User[];
}) {
  const buckets = rangeOf5dayBuckets(from, until);
  const isDaily = until.diff(from, "days").days <= 14; // if the range is less than 14 days, show daily data
  const data = buckets.map((bucket) => {
    const entries = analytics.filter(
      (entry) =>
        DateTime.fromISO(entry.date, { zone: "UTC" }) >= bucket.start &&
        DateTime.fromISO(entry.date, { zone: "UTC" }) <= bucket.end,
    );
    return {
      chats: users.filter(
        (user) =>
          user.createdAt >= bucket.start.toJSDate() &&
          user.createdAt <= bucket.end.toJSDate(),
      ).length,
      date: bucket.start,
      fromLLM: sumBy(
        entries.filter(
          (entry) =>
            entry.sessionSource === "chatgpt.com" ||
            entry.sessionSource === "perplexity.ai",
        ),
        (entry) => entry.visitors,
      ),
      sessionDuration: meanBy(entries, (entry) => entry.averageSessionDuration),
      visitors: sumBy(entries, (entry) => entry.visitors),
    };
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Object.entries(chartConfig).map(([key, value]) => (
        <SpecificChart
          data={data}
          dataKey={key}
          fill={value.color}
          isDaily={isDaily}
          key={key}
          name={value.label}
          valueFormatter={value.valueFormatter}
        />
      ))}
    </div>
  );
}

function rangeOf5dayBuckets(
  from: DateTime,
  until: DateTime,
): Array<{ start: DateTime; end: DateTime }> {
  const buckets = [];
  const totalDays = Math.ceil(until.diff(from, "days").days) + 1;

  // If the range is less than or equal to 14 days, return a bucket of each day.
  if (totalDays <= 14)
    return rangeOfDates(from, until).map((date) => ({
      start: date,
      end: date.endOf("day"),
    }));

  // Start at 'until', iterate down to 'from', making 5-day buckets (last may be partial)
  let cursor = until.setZone("UTC").endOf("day");
  while (cursor >= from.startOf("day")) {
    // Compute bucket start and end for this interval
    const bucketEnd = cursor;
    // For the final bucket, its start can't precede 'from'
    const bucketStart =
      bucketEnd.minus({ days: 4 }).startOf("day") < from.startOf("day")
        ? from.startOf("day")
        : bucketEnd.minus({ days: 4 }).startOf("day");
    buckets.unshift({ start: bucketStart, end: bucketEnd });

    // Move cursor to the next lower chunk
    cursor = bucketStart.minus({ days: 1 }).endOf("day");
  }
  return buckets;
}

function SpecificChart({
  data,
  dataKey,
  fill,
  isDaily,
  name,
  valueFormatter,
}: {
  isDaily: boolean;
  data: Array<{ date: DateTime }>;
  dataKey: DataKey<(typeof data)[number]>;
  fill: string;
  name: string;
  valueFormatter: (value: number) => string;
}) {
  return (
    <ChartContainer config={chartConfig} className="h-40 w-full">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis dataKey={({ date }) => date.toFormat("yyyy-MM-dd")} />
        <YAxis
          allowDecimals={false}
          tickFormatter={valueFormatter}
          tickLine={false}
          tickMargin={8}
          type="number"
        />

        <Area
          activeDot={{ fill: "var(--chart-active-dot)" }}
          dataKey={dataKey}
          fill={fill}
          name={name}
          type="monotone"
        />

        <ChartLegend content={<ChartLegendContent verticalAlign="top" />} />
        <ChartTooltip
          cursor
          content={
            <ChartTooltipContent
              labelFormatter={(value) => {
                const from = DateTime.fromISO(value).startOf("day");
                const to = from
                  .plus({ days: isDaily ? 1 : 6 })
                  .minus({ days: 1 })
                  .startOf("day");
                return isDaily
                  ? from.toFormat("MMM d")
                  : `${from.toFormat("MMM d")} — ${to.toFormat("MMM d")}`;
              }}
              formatter={(value, name) => (
                <div className="grid w-full grid-cols-2 gap-2">
                  <span>{name}</span>
                  <span className="text-right font-bold tabular-nums">
                    {valueFormatter(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
      </AreaChart>
    </ChartContainer>
  );
}

function rangeOfDates(from: DateTime, until: DateTime): DateTime[] {
  const allDates: DateTime[] = [];
  for (
    let current = from;
    current <= until;
    current = current.plus({ days: 1 })
  )
    allDates.push(current);

  return allDates;
}

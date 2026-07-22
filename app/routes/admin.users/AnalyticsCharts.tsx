import { Temporal } from "@js-temporal/polyfill";
import { meanBy, sumBy } from "es-toolkit";
import {
  BotIcon,
  BubblesIcon,
  ClockIcon,
  PersonStandingIcon,
} from "lucide-react";
import type { User } from "prisma/generated";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "~/components/ui/Card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/Chart";
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
  analytics: Analytics[];
  from: Temporal.PlainDate;
  until: Temporal.PlainDate;
  users: User[];
}) {
  return (
    <Card className="bg-secondary-background text-foreground">
      <CardContent>
        <SquareAnalyticsCharts
          analytics={analytics}
          from={from}
          until={until}
          users={users}
        />
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
  from: Temporal.PlainDate;
  until: Temporal.PlainDate;
  users: User[];
}) {
  const buckets = rangeOf5dayBuckets(from, until);
  const totalDays = from
    .until(until, { largestUnit: "day", smallestUnit: "day" })
    .total("days");
  const isDaily = totalDays <= 14; // if the range is less than 14 days, show daily data
  const data = buckets.map((bucket) => {
    const entries = analytics.filter((entry) => {
      const entryDate = Temporal.PlainDate.from(
        `${entry.date.slice(0, 4)}-${entry.date.slice(4, 6)}-${entry.date.slice(6, 8)}`,
      );
      return (
        Temporal.PlainDate.compare(entryDate, bucket.start.toString()) >= 0 &&
        Temporal.PlainDate.compare(entryDate, bucket.end.toString()) <= 0
      );
    });

    return {
      chats: users.filter(
        (user) =>
          user.createdAt.toISOString().localeCompare(bucket.start.toString()) >=
            0 &&
          user.createdAt.toISOString().localeCompare(bucket.end.toString()) <=
            0,
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
          dataKey={key as keyof typeof chartConfig}
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
  from: Temporal.PlainDate,
  until: Temporal.PlainDate,
): Array<{ start: Temporal.PlainDate; end: Temporal.PlainDate }> {
  const buckets: Array<{ start: Temporal.PlainDate; end: Temporal.PlainDate }> =
    [];
  const totalDays = from
    .until(until, { largestUnit: "day", smallestUnit: "day" })
    .total("days");

  // If the range is less than or equal to 14 days, return a bucket of each day.
  if (totalDays <= 14)
    return rangeOfDates(from, until).map((date) => ({
      start: date,
      end: date.add({ days: 1 }),
    }));

  // Start at 'until', iterate down to 'from', making 5-day buckets (last may be partial)
  let cursor = until.subtract({ days: 5 });
  while (Temporal.PlainDate.compare(cursor, from) >= 0) {
    // Compute bucket start and end for this interval
    // For the final bucket, its start can't precede 'from'
    const candidateStart = cursor.subtract({ days: 5 });
    buckets.unshift({ start: candidateStart, end: cursor });

    // Move cursor to the next lower chunk
    cursor = cursor.subtract({ days: 5 });
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
  data: Array<{ date: Temporal.PlainDate }>;
  dataKey: keyof typeof chartConfig;
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
        <XAxis dataKey={({ date }) => date.toString()} />
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
                const valueStr = typeof value === "string" ? value : "";
                const from = Temporal.PlainDate.from(valueStr);
                const to = Temporal.PlainDate.from(valueStr)
                  .add({ days: isDaily ? 1 : 6 })
                  .subtract({ days: 1 });
                return isDaily
                  ? from.toString()
                  : `${from.toString()} — ${to.toString()}`;
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

function rangeOfDates(
  from: Temporal.PlainDate,
  until: Temporal.PlainDate,
): Temporal.PlainDate[] {
  const allDates: Temporal.PlainDate[] = [];
  let current = from;
  while (Temporal.PlainDate.compare(current, until) <= 0) {
    allDates.push(current);
    current = current.add({ days: 1 });
  }
  return allDates;
}

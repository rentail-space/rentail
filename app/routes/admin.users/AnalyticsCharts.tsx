import { groupBy, meanBy, sumBy } from "es-toolkit";
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
  from: Date;
  until: Date;
  users: Promise<User[]>;
}) {
  return (
    <Card className="bg-secondary-background text-foreground">
      <CardContent>
        <Suspense fallback={<LoadingProgress />}>
          <Await resolve={Promise.all([analytics, users])}>
            {([analytics, users]) => (
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
  from: Date;
  until: Date;
  users: User[];
}) {
  const range = rangeOfDates(from, until);
  const groupOfDays = range.length >= 21 ? 6 : 1;
  const data = Object.entries(
    groupBy(range, (date) => Math.floor(range.indexOf(date) / groupOfDays)),
  ).map(([, dates]) => {
    const startAt = dates[0].setZone("UTC").startOf("day");
    const endAt = dates[dates.length - 1].setZone("UTC").endOf("day");
    const entries = analytics.filter(
      (entry) =>
        DateTime.fromISO(entry.date, { zone: "UTC" }) >= startAt &&
        DateTime.fromISO(entry.date, { zone: "UTC" }) <= endAt,
    );
    return {
      chats: users.filter(
        (user) =>
          user.createdAt >= startAt.toJSDate() &&
          user.createdAt <= endAt.toJSDate(),
      ).length,
      date: startAt,
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
          groupDays={groupOfDays}
          key={key}
          name={value.label}
          valueFormatter={value.valueFormatter}
        />
      ))}
    </div>
  );
}

function SpecificChart({
  data,
  dataKey,
  fill,
  groupDays,
  name,
  valueFormatter,
}: {
  groupDays: number;
  data: Array<{ date: DateTime }>;
  dataKey: DataKey<(typeof data)[number]>;
  fill: string;
  name: string;
  valueFormatter: (value: number) => string;
}) {
  return (
    <ChartContainer config={chartConfig} className="h-40 w-full">
      <AreaChart
        accessibilityLayer
        data={data}
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        responsive
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
                  .plus({ days: groupDays })
                  .minus({ days: 1 })
                  .startOf("day");
                return from.equals(to)
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

function rangeOfDates(from: Date, until: Date): DateTime[] {
  const allDates: DateTime[] = [];
  for (
    let current = DateTime.fromJSDate(from);
    current <= DateTime.fromJSDate(until);
    current = current.plus({ days: 1 })
  )
    allDates.push(current);

  return allDates;
}

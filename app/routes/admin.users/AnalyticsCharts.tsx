import { groupBy, meanBy, sumBy } from "es-toolkit";
import {
  BotIcon,
  BubblesIcon,
  ClockIcon,
  PersonStandingIcon,
} from "lucide-react";
import { DateTime } from "luxon";
import type { User } from "prisma/generated/client";
import {
  Area,
  AreaChart,
  CartesianGrid,
  type DataKey,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/Card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/Chart";
import { dateRange } from "~/lib/time";
import type { loader } from "./route";

const chartConfig = {
  visitors: {
    label: "Unique Visitors",
    icon: PersonStandingIcon,
    color: "var(--chart-1)",
  },
  fromLLM: {
    label: "Visitors from LLM",
    icon: BotIcon,
    color: "var(--chart-2)",
  },
  chats: {
    label: "Chats Started",
    icon: BubblesIcon,
    color: "var(--chart-3)",
  },
  sessionDuration: {
    label: "Avg Session Duration",
    icon: ClockIcon,
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

/**
 * A component that displays the analytics charts.
 *
 * @param param0 analytics - The analytics data.
 * @param param0 range - The range of dates.
 * @param param0 users - The users data.
 * @returns The analytics charts.
 */
export default function AnalyticsCharts({
  analytics,
  fromUntil,
  users,
}: {
  analytics: Awaited<ReturnType<typeof loader>>["analytics"];
  fromUntil: [DateTime, DateTime];
  users: User[];
}) {
  const range = rangeOfDates(...fromUntil);
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
    <Card className="bg-secondary-background text-foreground">
      <CardHeader className="text-center">
        <CardTitle className="font-bold text-lg">
          Visitors &rarr; Chats + Session Duration
        </CardTitle>
      </CardHeader>

      <CardContent className="grid gap-4 md:grid-cols-2">
        {Object.entries(chartConfig).map(([key, value]) => (
          <SpecificChart
            data={data}
            dataKey={key}
            fill={value.color}
            groupDays={groupOfDays}
            key={key}
            name={value.label}
            yAxisFormatter={
              key === "sessionDuration"
                ? (value) =>
                    `${Math.floor(value / 60).toLocaleString()}m${Math.floor(
                      value % 60,
                    )
                      .toString()
                      .padStart(2, "0")}s`
                : undefined
            }
          />
        ))}
      </CardContent>

      <CardFooter className="mx-auto flex items-center gap-2 text-muted-foreground leading-none">
        {dateRange(range[0].toJSDate(), range[range.length - 1].toJSDate())}
      </CardFooter>
    </Card>
  );
}

function SpecificChart({
  data,
  dataKey,
  fill,
  groupDays,
  name,
  yAxisFormatter,
}: {
  groupDays: number;
  data: Array<{ date: DateTime }>;
  dataKey: DataKey<(typeof data)[number]>;
  fill: string;
  name: string;
  yAxisFormatter?: (value: number) => string;
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
        <XAxis
          dataKey={({ date }) => date.toFormat("yyyy-MM-dd")}
          tick={({ x, y, payload }) => (
            <text x={x + 20} y={y + 10} textAnchor="end" fontSize={12}>
              {DateTime.fromISO(payload.value).toFormat("MMM d")}
            </text>
          )}
        />
        <YAxis
          allowDecimals={false}
          tickFormatter={yAxisFormatter}
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
                    {yAxisFormatter ? yAxisFormatter(Number(value)) : value}
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

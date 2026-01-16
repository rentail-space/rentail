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
  range,
  users,
}: {
  analytics: Awaited<ReturnType<typeof loader>>["analytics"];
  range: [Date, Date];
  users: User[];
}) {
  // Create a range of DateTime objects from start to end (inclusive), by day
  const allDates: DateTime[] = [];
  const endDate = DateTime.fromJSDate(range[1]);
  for (
    let current = DateTime.fromJSDate(range[0]);
    current <= endDate;
    current = current.plus({ days: 1 })
  )
    allDates.push(current);

  const groupingBy = allDates.length >= 21 ? "week" : "day";
  const dateRanges = Object.entries(
    groupBy(allDates, (date) => date.startOf(groupingBy).toFormat("yyyyMMdd")),
  ).map(([, dates]) => [
    dates[0].startOf("day"),
    dates[dates.length - 1].endOf("day"),
  ]);

  const data = dateRanges.map(([startDate, endDate]) => {
    const entries = analytics.filter(
      (entry) =>
        DateTime.fromISO(entry.date) >= startDate &&
        DateTime.fromISO(entry.date) <= endDate,
    );
    const chats = users.filter(
      (user) =>
        user.createdAt >= startDate.startOf("day").toJSDate() &&
        user.createdAt <= endDate.endOf("day").toJSDate(),
    );
    return {
      date: startDate.toFormat("yyyyMMdd"),
      visitors: sumBy(entries, (entry) => entry.visitors) ?? 0,
      fromLLM:
        sumBy(
          entries.filter(
            (entry) =>
              entry.sessionSource === "chatgpt.com" ||
              entry.sessionSource === "perplexity.ai",
          ),
          (entry) => entry.visitors,
        ) ?? 0,
      chats: chats.length,
      sessionDuration:
        meanBy(entries, (entry) => entry.averageSessionDuration) ?? 0,
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
            key={key}
            data={data}
            dataKey={key}
            fill={value.color}
            name={value.label}
            groupingBy={groupingBy}
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
        {dateRange(
          allDates[0].toJSDate(),
          allDates[allDates.length - 1].toJSDate(),
        )}
      </CardFooter>
    </Card>
  );
}

function SpecificChart({
  data,
  dataKey,
  fill,
  name,
  groupingBy,
  yAxisFormatter,
}: {
  data: Array<{ date: string }>;
  dataKey: DataKey<(typeof data)[number]>;
  fill: string;
  name: string;
  groupingBy: "day" | "week";
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
          angle={45}
          dataKey={({ date }) => DateTime.fromISO(date).toFormat("yyyy-MM-dd")}
          tick={({ x, y, payload }) => (
            <text x={x + 20} y={y + 10} textAnchor="end" fontSize={12}>
              {DateTime.fromISO(payload.value).toFormat("MMM d")}
            </text>
          )}
          tickCount={5}
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
                  .plus({ [groupingBy]: 1 })
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

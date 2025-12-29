import { groupBy, meanBy, sortBy, sumBy } from "es-toolkit";
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
  CardDescription,
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

export default function Charts({
  analytics,
  users,
}: {
  analytics: Awaited<ReturnType<typeof loader>>["analytics"];
  users: User[];
}) {
  const allDates = analytics.map((entry) => DateTime.fromISO(entry.date));
  const minDate = DateTime.min(...allDates);
  const maxDate = DateTime.max(...allDates);
  const datesBetween =
    minDate && maxDate ? maxDate.diff(minDate, "days").days : 0;
  const grouping = datesBetween >= 21 ? "week" : "day";

  const groupedByDate = Object.entries(
    groupBy(analytics, (entry) =>
      DateTime.fromISO(entry.date).startOf(grouping).toFormat("yyyy-MM-dd"),
    ),
  );
  const chartData = sortBy(
    groupedByDate.map(([date, entries]) => ({
      date,
      visitors: sumBy(entries, (entry) => entry.visitors),
      fromLLM: sumBy(
        entries.filter(
          (entry) =>
            entry.sessionSource === "chatgpt.com" ||
            entry.sessionSource === "perplexity.ai",
        ),
        (entry) => entry.visitors,
      ),
      chats: users.filter(
        (user) =>
          user.createdAt >=
            DateTime.fromISO(date).startOf(grouping).toJSDate() &&
          user.createdAt <= DateTime.fromISO(date).endOf(grouping).toJSDate(),
      ).length,
      sessionDuration: meanBy(entries, (entry) => entry.averageSessionDuration),
    })),
    ["date"],
  );

  return (
    <Card className="bg-secondary-background text-foreground">
      <CardHeader className="text-center">
        <CardTitle>Visitors &rarr; Chats + Session Duration</CardTitle>
        <CardDescription>
          Showing unique visitors, chats started by these visitors, and average
          session duration across all visitors.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4 md:grid-cols-2">
        {Object.entries(chartConfig).map(([key, value]) => (
          <GroupedChart
            key={key}
            chartData={chartData}
            dataKey={key}
            fill={value.color}
            grouping={grouping}
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
        {DateTime.fromISO(chartData[0]?.date)
          .startOf(grouping)
          .toFormat("MMM d, yyyy")}{" "}
        &mdash;{" "}
        {DateTime.fromISO(chartData[chartData.length - 1]?.date)
          .endOf(grouping)
          .toFormat("MMM d, yyyy")}{" "}
        {grouping === "week" && "(weekly metrics)"}
      </CardFooter>
    </Card>
  );
}

function GroupedChart({
  chartData,
  dataKey,
  fill,
  grouping,
  name,
  yAxisFormatter,
}: {
  chartData: Array<{ date: string }>;
  dataKey: DataKey<(typeof chartData)[number]>;
  fill: string;
  grouping: "week" | "day";
  name: string;
  yAxisFormatter?: (value: number) => string;
}) {
  return (
    <ChartContainer config={chartConfig} className="h-38 w-full">
      <AreaChart
        accessibilityLayer
        data={chartData}
        responsive
        margin={{ left: 12, right: 12 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={({ date }) =>
            grouping === "week"
              ? [
                  DateTime.fromISO(date).toFormat("MMM d"),
                  DateTime.fromISO(date).endOf(grouping).toFormat("MMM d"),
                ].join(" - ")
              : DateTime.fromISO(date).toFormat("MMM d")
          }
          tickLine={false}
          tickMargin={8}
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

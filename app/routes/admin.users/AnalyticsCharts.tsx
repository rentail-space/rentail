import { groupBy, sortBy, sumBy } from "es-toolkit";
import { BubblesIcon, ClockIcon, PersonStandingIcon } from "lucide-react";
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

export default function Charts({
  analytics,
  users,
}: {
  analytics: Array<{
    activeUsers: number;
    averageSessionDuration: number;
    date: string;
    sessionSource: string;
  }>;
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
      activeUsers: sumBy(entries, (entry) => entry.activeUsers),
      chats: users.filter(
        (user) =>
          user.createdAt >=
            DateTime.fromISO(date).startOf(grouping).toJSDate() &&
          user.createdAt <= DateTime.fromISO(date).endOf(grouping).toJSDate(),
      ).length,
      sessionDuration: Math.round(
        sumBy(entries, (entry) => entry.averageSessionDuration) /
          entries.length,
      ),
    })),
    ["date"],
  );

  return (
    <Card className="bg-secondary-background text-foreground">
      <CardHeader className="text-center">
        <CardTitle>Active Users &rarr; Chats + Session Duration</CardTitle>
        <CardDescription>
          Showing active users (page views), chats started, and average session
          duration (seconds).
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-8">
        <GroupedChart
          chartData={chartData}
          dataKey="activeUsers"
          fill={chartConfig.activeUsers.color}
          grouping={grouping}
          name={chartConfig.activeUsers.label as string}
        />
        <GroupedChart
          chartData={chartData}
          dataKey="chats"
          fill={chartConfig.chats.color}
          grouping={grouping}
          name={chartConfig.chats.label as string}
        />
        <GroupedChart
          chartData={chartData}
          dataKey="sessionDuration"
          fill={chartConfig.sessionDuration.color}
          grouping={grouping}
          name={chartConfig.sessionDuration.label as string}
          yAxisFormatter={(value) => `${value} sec`}
        />
      </CardContent>

      <CardFooter className="mx-auto flex items-center gap-2 text-muted-foreground leading-none">
        {chartData[0].date} &mdash; {chartData[chartData.length - 1].date}
      </CardFooter>
    </Card>
  );
}

const chartConfig = {
  activeUsers: {
    label: "Active Users",
    icon: PersonStandingIcon,
    color: "var(--chart-1)",
  },
  chats: {
    label: "Chats",
    icon: BubblesIcon,
    color: "var(--chart-2)",
  },
  sessionDuration: {
    label: "Duration",
    icon: ClockIcon,
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

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
    <ChartContainer config={chartConfig} className="h-32 w-full">
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

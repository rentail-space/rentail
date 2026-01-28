import { groupBy, meanBy, sumBy } from "es-toolkit";
import { BarChartIcon, PercentIcon, StarIcon } from "lucide-react";
import { DateTime } from "luxon";
import {
  Area,
  AreaChart,
  CartesianGrid,
  type DataKey,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "~/components/ui/Card";

const chartConfig = {
  rentail: {
    label: "Rentail Citations",
    icon: BarChartIcon,
    color: "var(--chart-1)",
    valueFormatter: (value: number) => value.toLocaleString(),
  },
  ratio: {
    label: "Citation Ratio",
    icon: PercentIcon,
    color: "var(--chart-3)",
    valueFormatter: (value: number) => value.toLocaleString(),
  },
  score: {
    label: "Score",
    icon: StarIcon,
    color: "var(--chart-2)",
    valueFormatter: (value: number) => value.toLocaleString(),
  },
};

export default function VisibilityCharts({
  visibility,
}: {
  visibility: {
    category: string;
    citations: string[];
    query: string;
    createdAt: Date;
  }[];
}) {
  const groupedByDate = Object.entries(
    groupBy(visibility, ({ createdAt }) => createdAt.toISOString()),
  ).map(([date, queries]) => ({
    date,
    queries: queries.map((query) => ({
      category: query.category,
      citations: query.citations,
      query: query.query,
      ratio: citationRatio(query.citations),
      rentail: query.citations.filter(isRentail).length,
      score: scoreCitations(query.citations),
    })),
  }));

  // Group by day so we have score, ratio, etc calculated from all
  // queries for that day
  const dailyTotals = groupedByDate.map(({ date, queries }) => {
    return {
      date,
      rentail: sumBy(queries, (query) => query.rentail),
      score: sumBy(queries, (query) => query.score),
      ratio: sumBy(queries, (query) => query.ratio),
    };
  });

  // Aggregate by week so we have average score, ratio, etc for that week.
  const weeklyAggregates = Object.entries(
    groupBy(dailyTotals, ({ date }) =>
      DateTime.fromISO(date).startOf("day").toFormat("yyyy-MM-dd"),
    ),
  )
    .map(([date, metrics]) => ({
      date,
      rentail: meanBy(metrics, (metric) => metric.rentail),
      score: meanBy(metrics, (metric) => metric.score),
      ratio: meanBy(metrics, (metric) => metric.ratio),
    }))
    .sort((a, b) =>
      DateTime.fromISO(a.date).diff(DateTime.fromISO(b.date)).toMillis(),
    );

  return (
    <Card className="bg-secondary-background text-foreground">
      <CardContent className="grid gap-4 md:grid-cols-2">
        {Object.entries(chartConfig).map(([key, value]) => (
          <SpecificChart
            data={weeklyAggregates}
            dataKey={key}
            fill={value.color}
            key={key}
            name={value.label}
            valueFormatter={value.valueFormatter}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function SpecificChart({
  data,
  dataKey,
  fill,
  name,
}: {
  data: Array<{
    date: string;
    ratio: number;
    rentail: number;
    score: number;
  }>;
  dataKey: DataKey<(typeof data)[number]>;
  fill: string;
  name: string;
  valueFormatter: (value: number) => string;
}) {
  return (
    <AreaChart
      data={data}
      height={200}
      margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
      responsive={false}
      width={450}
    >
      <CartesianGrid vertical={false} />
      <XAxis dataKey={({ date }) => date} />
      <YAxis
        allowDecimals={false}
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

      <Legend />
      <Tooltip
        content={({ payload, label }) => (
          <div className="flex w-full flex-row gap-2 bg-background p-2">
            <span>{label}</span>
            <span>{payload?.[0]?.name}</span>
            <span className="text-right font-bold">{payload?.[0]?.value}</span>
          </div>
        )}
      />
    </AreaChart>
  );
}

function citationRatio(citations: string[]): number {
  return citations.length > 0
    ? citations.filter(isRentail).length / citations.length
    : 0;
}

function scoreCitations(citations: string[]): number {
  const isFirstPlace = citations.length > 0 && isRentail(citations[0]);
  return (isFirstPlace ? 50 : 0) + citations.filter(isRentail).length * 10;
}

function isRentail(citation: string): boolean {
  return new URL(citation).hostname === "rentail.space";
}

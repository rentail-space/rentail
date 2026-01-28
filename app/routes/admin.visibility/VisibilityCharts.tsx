import { BarChartIcon, PercentIcon, StarIcon } from "lucide-react";
import { DateTime } from "luxon";
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
  metrics: data,
}: {
  metrics: Array<{
    date: string;
    ratio: number;
    rentail: number;
    score: number;
  }>;
}) {
  return (
    <Card className="bg-secondary-background text-foreground">
      <CardContent className="grid gap-4 md:grid-cols-2">
        {Object.entries(chartConfig).map(([key, value]) => (
          <SpecificChart
            data={data}
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
    <ChartContainer config={chartConfig} className="h-40 w-full">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
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

        <ChartLegend content={<ChartLegendContent verticalAlign="top" />} />
        <ChartTooltip
          cursor
          content={
            <ChartTooltipContent
              labelFormatter={(value) => {
                const from = DateTime.fromISO(value).startOf("day");
                return from.toFormat("MMM d");
              }}
              formatter={(value, name) => (
                <div className="grid w-full grid-cols-2 gap-2">
                  <span>{name}</span>
                  <span className="text-right font-bold tabular-nums">
                    {Number(value).toLocaleString()}
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

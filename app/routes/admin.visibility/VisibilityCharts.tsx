import { mean } from "es-toolkit";
import { BarChartIcon, PercentIcon, StarIcon } from "lucide-react";
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

type Check = {
  citations: string[];
  mentioned: boolean;
};

type Run = {
  checks: Check[];
  createdAt: Date;
  id: string;
};

type RunPoint = {
  date: string;
  visibilityPct: number;
  citationRatio: number;
  score: number;
};

const chartConfig = {
  visibilityPct: {
    label: "Visibility %",
    icon: PercentIcon,
    color: "var(--chart-1)",
  },
  citationRatio: {
    label: "Citation Ratio",
    icon: BarChartIcon,
    color: "var(--chart-3)",
  },
  score: {
    label: "Score",
    icon: StarIcon,
    color: "var(--chart-2)",
  },
};

export default function VisibilityCharts({ runs }: { runs: Run[] }) {
  const points: RunPoint[] = runs
    .slice()
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((run) => {
      const checks = run.checks;
      const visibilityPct =
        mean(checks.map((c) => (c.mentioned ? 1 : 0))) * 100;
      const citationRatio = mean(
        checks.map((c) => {
          const rentail = c.citations.filter(isRentail).length;
          return c.citations.length > 0 ? rentail / c.citations.length : 0;
        }),
      );
      const score = mean(
        checks.map((c) => {
          const isFirst = c.citations.length > 0 && isRentail(c.citations[0]);
          const rentailCount = c.citations.filter(isRentail).length;
          return (isFirst ? 50 : 0) + rentailCount * 10;
        }),
      );
      return {
        date: run.createdAt.toISOString().slice(0, 10),
        visibilityPct,
        citationRatio,
        score,
      };
    });

  return (
    <Card className="bg-secondary-background text-foreground">
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(chartConfig).map(([key, value]) => (
            <VisibilityChart
              key={key}
              data={points}
              dataKey={key as DataKey<RunPoint>}
              fill={value.color}
              name={value.label}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function VisibilityChart({
  data,
  dataKey,
  fill,
  name,
}: {
  data: RunPoint[];
  dataKey: DataKey<RunPoint>;
  fill: string;
  name: string;
}) {
  return (
    <ChartContainer config={chartConfig} className="h-40 w-full">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" />
        <YAxis allowDecimals={false} tickLine={false} tickMargin={8} />
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
                    {Number(value).toFixed(1)}
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

function isRentail(url: string): boolean {
  try {
    return new URL(url).hostname === "rentail.space";
  } catch {
    return false;
  }
}

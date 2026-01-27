import { HeatmapRect } from "@visx/heatmap";
import { scaleLinear } from "@visx/scale";
import { clamp, groupBy, range, sumBy } from "es-toolkit";
import { DateTime } from "luxon";
import type { User } from "prisma/generated/client";
import { Suspense } from "react";
import { Await, useSearchParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import LoadingProgress from "~/components/ui/LoadingProgress";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHeader,
  TableRow,
} from "~/components/ui/Table";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/Tabs";
import type { Analytics } from "./route";

const hours = range(6, 23);
const weekdays = range(0, 7);

export default function Heatmap({
  analytics,
  users,
}: {
  analytics: Promise<Analytics[]>;
  users: Promise<User[]>;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const onlyFrom =
    (searchParams.get("onlyFrom") as
      | "all"
      | "llm"
      | "search"
      | "users"
      | undefined) ?? "all";
  const setOnlyFrom = (value: string) => {
    setSearchParams((params) => {
      params.set("onlyFrom", value);
      return params;
    });
  };

  return (
    <Card className="bg-secondary-background text-foreground">
      <CardHeader>
        <CardTitle className="font-bold text-lg">
          Heatmap of Visitors by Day & Hour
        </CardTitle>
        <Tabs value={onlyFrom} className="mx-auto">
          <TabsList>
            <TabsTrigger value="all" onClick={() => setOnlyFrom("all")}>
              All Sources
            </TabsTrigger>
            <TabsTrigger value="llm" onClick={() => setOnlyFrom("llm")}>
              LLM Visitors
            </TabsTrigger>
            <TabsTrigger value="search" onClick={() => setOnlyFrom("search")}>
              Search Visitors
            </TabsTrigger>
            <TabsTrigger value="users" onClick={() => setOnlyFrom("users")}>
              Chats
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent>
        <Suspense fallback={<LoadingProgress />}>
          <Await resolve={Promise.all([analytics, users])}>
            {([analytics, users]) => (
              <HeatmapTable
                analytics={analytics}
                users={users}
                onlyFrom={onlyFrom}
              />
            )}
          </Await>
        </Suspense>
      </CardContent>
    </Card>
  );
}

function HeatmapTable({
  analytics,
  users,
  onlyFrom,
}: {
  analytics: Analytics[];
  users: User[];
  onlyFrom: "all" | "llm" | "search" | "users";
}) {
  const columns =
    onlyFrom === "users"
      ? usersToBins(users)
      : analyticsToBins(analytics, onlyFrom);
  const size = 52;
  const width = columns.length * size;
  const xScale = scaleLinear<number>({
    domain: [0, columns.length],
    range: [0, width],
  });
  const height = weekdays.length * size;
  const yScale = scaleLinear<number>({
    domain: [0, Math.max(...columns.map(({ bins }) => bins.length))],
    range: [0, height],
  });

  const colorMax = Math.max(
    ...columns.flatMap(({ bins }) => bins.map(({ count }) => count)),
  );
  const rectColorScale = scaleLinear<string>({
    domain: [0, colorMax],
    range: ["#020509", "#05E17A"],
  });
  const opacityScale = scaleLinear<number>({
    domain: [0, colorMax],
    range: [0.1, 1],
  });

  return (
    <div className="relative">
      <Table className="w-70">
        <TableHeader>
          <TableRow>
            <TableCell style={{ minWidth: size }}>&nbsp;</TableCell>
            {hours.map((hour) => (
              <TableCell
                key={hour}
                style={{ minWidth: size }}
                className="text-center"
              >
                {hour}:00
              </TableCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <TableRow key={day}>
              <TableCell
                style={{ width: size, height: size }}
                className="text-center"
              >
                {day}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>

        <TableCaption>
          <Legend
            onlyFrom={onlyFrom}
            colorMax={colorMax}
            opacityScale={opacityScale}
            rectColorScale={rectColorScale}
          />
        </TableCaption>
      </Table>

      <svg
        height={height + size}
        style={{ position: "absolute", top: 32, left: 58 }}
        width={width + size}
      >
        <title>Heatmap</title>
        <HeatmapRect
          data={columns}
          xScale={(column) => xScale(column)}
          yScale={(row) => yScale(row)}
          colorScale={rectColorScale}
          opacityScale={opacityScale}
          binWidth={width / columns.length}
          binHeight={height / weekdays.length}
          gap={8}
        >
          {(heatmap) =>
            heatmap.map((bins) =>
              bins.map((bin) => (
                <rect
                  key={`${bin.x}-${bin.y}`}
                  width={bin.width}
                  height={bin.height}
                  x={bin.x}
                  y={bin.y}
                  fill={bin.color}
                  fillOpacity={bin.opacity}
                />
              )),
            )
          }
        </HeatmapRect>
      </svg>
    </div>
  );
}

function Legend({
  onlyFrom,
  colorMax,
  opacityScale,
  rectColorScale,
}: {
  onlyFrom: "all" | "llm" | "search" | "users";
  colorMax: number;
  opacityScale: (value: number) => number;
  rectColorScale: (value: number) => string;
}) {
  // Determine the range for the legend (steps)
  // Use 5 color stops spanning the range
  const steps = 5;
  const stops = Array.from({ length: steps }, (_, i) =>
    Math.round((i / (steps - 1)) * colorMax),
  );
  // Ensure unique and sorted stops (if colorMax=0, just show 0)
  const uniqueStops = [...new Set(stops)].sort((a, b) => a - b);

  return (
    <div className="flex items-center gap-4">
      <span>{onlyFrom === "users" ? "Users" : "Visitors"}:</span>
      {uniqueStops.map((value, i) => (
        <div key={value} className="flex items-center gap-2">
          <svg
            width={24}
            height={24}
            style={{ display: "inline" }}
            aria-hidden="true"
          >
            <rect
              x={0}
              y={0}
              width={24}
              height={24}
              rx={3}
              fill={rectColorScale(value)}
              fillOpacity={opacityScale(value)}
              stroke="#666"
              strokeWidth={0.5}
            />
          </svg>
          <span className="text-muted-foreground text-xs">
            {value}
            {i === uniqueStops.length - 1 && colorMax > 0 && value !== colorMax
              ? "+" // indicate max value, for the last stop, if colorMax wasn't already included due to rounding
              : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

function analyticsToBins(
  analytics: Analytics[],
  onlyFrom: "all" | "llm" | "search",
) {
  const selected =
    onlyFrom === "llm"
      ? analytics.filter((entry) =>
          ["chatgpt.com", "perplexity.ai"].includes(entry.sessionSource),
        )
      : onlyFrom === "search"
        ? analytics.filter((entry) =>
            ["google", "duckduckgo.com", "bing"].includes(entry.sessionSource),
          )
        : analytics;

  const adjusted = selected.map((entry) => {
    const date = DateTime.fromISO(
      `${entry.date}T${entry.hour.toString().padStart(2, "0")}`,
      { zone: "UTC" },
    );
    // Luxon: 1 is Monday and 7 is Sunday -> JS: 0 is Sunday and 6 is Saturday
    const weekday = date.weekday % 6;
    // Visually we're only showing 6-22 hours
    const hour = clamp(date.hour, hours[0], hours[hours.length - 1]);
    return {
      hour,
      sessionSource: entry.sessionSource,
      visitors: entry.visitors,
      weekday,
    };
  });

  return hours.map((hour) => {
    const thisHour = groupBy(adjusted, (entry) => entry.hour)[hour] ?? [];
    return {
      bin: hour,
      bins: weekdays.map((weekday) => {
        const thisWeekday =
          groupBy(thisHour, (entry) => entry.weekday)[weekday] ?? [];
        return {
          bin: weekday,
          count: sumBy(thisWeekday, (entry) => entry.visitors),
        };
      }),
    };
  });
}

function usersToBins(users: User[]) {
  const adjusted = users.map((user) => {
    const { hour, weekday } = DateTime.fromJSDate(user.createdAt);
    const clamped = clamp(hour, hours[0], hours[hours.length - 1]);
    return { hour: clamped, user, weekday };
  });
  return hours.map((hour) => {
    const thisHour = groupBy(adjusted, (user) => user.hour)[hour] ?? [];
    return {
      bin: hour,
      bins: weekdays.map((weekday) => {
        const thisWeekday =
          groupBy(thisHour, (user) => user.weekday)[weekday] ?? [];
        return { bin: weekday, count: thisWeekday.length };
      }),
    };
  });
}

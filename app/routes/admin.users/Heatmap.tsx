import { HeatmapRect } from "@visx/heatmap";
import { scaleLinear } from "@visx/scale";
import { clamp, groupBy, range, sumBy } from "es-toolkit";
import { DateTime } from "luxon";
import { parseAsStringEnum, useQueryState } from "nuqs";
import type { User } from "prisma/generated/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "~/components/ui/Table";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/Tabs";
import type { loader } from "./route";

const hours = range(6, 23);
const weekdays = range(0, 7);

export default function Heatmap({
  analytics,
  users,
}: {
  analytics: Awaited<ReturnType<typeof loader>>["analytics"];
  users: User[];
}) {
  const [onlyFrom, setOnlyFrom] = useQueryState(
    "onlyFrom",
    parseAsStringEnum(["all", "llm", "search", "users"])
      .withDefault("all")
      .withOptions({
        history: "replace",
      }),
  );

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
    <section className="flex flex-col gap-4">
      <h2 className="font-bold text-2xl">Heatmap of Visitors by Day & Hour</h2>

      <Tabs value={onlyFrom} className="mx-auto">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setOnlyFrom("all")}>
            All Sources
          </TabsTrigger>
          <TabsTrigger value="llm" onClick={() => setOnlyFrom("llm")}>
            Only from LLM
          </TabsTrigger>
          <TabsTrigger value="search" onClick={() => setOnlyFrom("search")}>
            Only from Search
          </TabsTrigger>
          <TabsTrigger value="users" onClick={() => setOnlyFrom("users")}>
            Only from Users
          </TabsTrigger>
        </TabsList>
      </Tabs>

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
    </section>
  );
}

function analyticsToBins(
  analytics: Awaited<ReturnType<typeof loader>>["analytics"],
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

  // Adjust to local timezone, fix weekday number, and clamp the hour to 6-22
  const adjusted = selected.map((entry) => {
    const date = DateTime.fromISO(
      `${entry.date}T${entry.hour.toString().padStart(2, "0")}`,
      { zone: "UTC" },
    ).setZone("America/Los_Angeles");
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
  // Adjust to local timezone and clamp hours to between 6am and 10pm
  const adjusted = users.map((user) => {
    const { hour, weekday } = DateTime.fromJSDate(user.createdAt, {
      zone: "America/Los_Angeles",
    });
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

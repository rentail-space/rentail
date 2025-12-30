import { HeatmapRect } from "@visx/heatmap";
import { scaleLinear } from "@visx/scale";
import { clamp, groupBy, range, sumBy } from "es-toolkit";
import { DateTime } from "luxon";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "~/components/ui/Table";
import type { loader } from "./route";

export default function Heatmap({
  analytics,
}: {
  analytics: Awaited<ReturnType<typeof loader>>["analytics"];
}) {
  const groupedByHour = groupBy(analytics, (entry) => clamp(entry.hour, 6, 22));
  const columns = Object.entries(groupedByHour).map(([hour, entries]) => {
    // Luxon: 1 is Monday and 7 is Sunday -> JS: 0 is Sunday and 6 is Saturday
    const groupByDay = groupBy(
      entries,
      (entry) => DateTime.fromISO(entry.date).weekday % 6,
    );
    return {
      bin: hour,
      bins: range(0, 7).map((day) => ({
        bin: day,
        count: sumBy(groupByDay[day] ?? [], (entry) => entry.visitors),
      })),
    };
  });

  const size = 52;
  const width = columns.length * size;
  const xScale = scaleLinear<number>({
    domain: [0, columns.length],
    range: [0, width],
  });
  const height = 7 * size;
  const yScale = scaleLinear<number>({
    domain: [0, Math.max(...columns.map(({ bins }) => bins.length))],
    range: [0, height],
  });

  console.log("%o", columns);

  const colorMax = Math.max(
    ...columns.flatMap(({ bins }) => bins.map(({ count }) => count)),
  );
  const rectColorScale = scaleLinear<string>({
    domain: [0, colorMax],
    range: ["#122549", "#b4fbde"],
  });
  const opacityScale = scaleLinear<number>({
    domain: [0, colorMax],
    range: [0.1, 1],
  });

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-bold text-2xl">Heatmap of activity by day/hour</h2>

      <div className="relative">
        <Table className="w-70">
          <TableHeader>
            <TableRow>
              <TableCell style={{ minWidth: size }}>&nbsp;</TableCell>
              {range(6, 23).map((hour) => (
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
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat  "].map((day) => (
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
            binHeight={height / 7}
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

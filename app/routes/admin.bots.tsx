import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";
import { DateTime } from "luxon";
import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/Table";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/Tabs";
import prisma from "~/lib/prisma";
import { verifyAdmin } from "~/lib/sessions.server";
import type { Route } from "./+types/admin.bots";

export async function loader({ request }: Route.LoaderArgs) {
  await verifyAdmin(request.headers);

  const daysParam = new URL(request.url).searchParams.get("days");
  const days = daysParam ? Number.parseInt(daysParam, 10) : 30;

  // Get all bot visits in date range
  const visits = await prisma.botVisit.findMany({
    where: {
      date: {
        gte: DateTime.utc()
          .minus({ days: days - 1 })
          .startOf("day")
          .toJSDate(),
        lte: DateTime.utc().endOf("day").toJSDate(),
      },
    },
    orderBy: [{ date: "asc" }, { botType: "asc" }],
  });

  // Aggregate by date and bot type
  const dailyByBot = visits.reduce<Record<string, Record<string, number>>>(
    (acc, visit) => {
      const dateKey = DateTime.fromJSDate(visit.date).toFormat("yyyy-MM-dd");
      if (!acc[dateKey]) acc[dateKey] = {};
      if (!acc[dateKey][visit.botType]) acc[dateKey][visit.botType] = 0;
      acc[dateKey][visit.botType] += visit.count;
      return acc;
    },
    {},
  );

  // Get top bots by total visits
  const botTotals = visits.reduce<Record<string, number>>((acc, visit) => {
    if (!acc[visit.botType]) acc[visit.botType] = 0;
    acc[visit.botType] += visit.count;
    return acc;
  }, {});

  const topBots = Object.entries(botTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([botType]) => botType);

  // Chart data: Daily totals + breakdown by top bots
  const chartData = Object.keys(dailyByBot)
    .sort()
    .map((date) => ({
      date,
      total: Object.values(dailyByBot[date]).reduce(
        (sum, count) => sum + count,
        0,
      ),
      ...topBots.reduce(
        (acc, bot) => {
          acc[bot] = dailyByBot[date][bot] || 0;
          return acc;
        },
        {} as Record<string, number>,
      ),
    }));

  // Recent visits table (last 7 days, top 10 bots)
  const recentVisits = await prisma.botVisit.findMany({
    where: {
      date: {
        gte: DateTime.utc().minus({ days: 6 }).startOf("day").toJSDate(),
      },
    },
    orderBy: [{ date: "desc" }, { count: "desc" }],
  });

  const recentByBot = recentVisits.reduce<
    Record<string, { botType: string; total: number; paths: Set<string> }>
  >((acc, visit) => {
    if (!acc[visit.botType]) {
      acc[visit.botType] = {
        botType: visit.botType,
        total: 0,
        paths: new Set<string>(),
      };
    }
    acc[visit.botType].total += visit.count;
    acc[visit.botType].paths.add(visit.path);
    return acc;
  }, {});

  const recentBotStats = Object.values(recentByBot)
    .map((bot) => ({
      botType: bot.botType,
      total: bot.total,
      uniquePaths: bot.paths.size,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);

  // Path popularity
  const pathStats = recentVisits.reduce<
    Record<string, { path: string; count: number; bots: Set<string> }>
  >((acc, visit) => {
    if (!acc[visit.path]) {
      acc[visit.path] = {
        path: visit.path,
        count: 0,
        bots: new Set<string>(),
      };
    }
    acc[visit.path].count += visit.count;
    acc[visit.path].bots.add(visit.botType);
    return acc;
  }, {});

  const topPaths = Object.values(pathStats)
    .map((stat) => ({
      path: stat.path,
      count: stat.count,
      uniqueBots: stat.bots.size,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return {
    chartData,
    topBots,
    recentBotStats,
    topPaths,
    days,
    totalVisits: Object.values(botTotals).reduce(
      (sum, count) => sum + count,
      0,
    ),
    uniqueBots: Object.keys(botTotals).length,
  };
}

export default function BotsPage({ loaderData }: Route.ComponentProps) {
  const [days, setDays] = useState(loaderData.days);

  return (
    <section className="space-y-4">
      <h1 className="text-center font-bold text-2xl">Bot Traffic</h1>

      <Tabs>
        <TabsList>
          {[30, 60, 90].map((days) => (
            <TabsTrigger
              key={days}
              onClick={() => setDays(days)}
              value={days.toString()}
            >
              Last {days} Days
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <section className="mb-6 grid grid-cols-3 gap-4">
        {[
          {
            label: "Total Visits",
            value: loaderData.totalVisits.toLocaleString(),
          },
          {
            label: "Unique Bots",
            value: loaderData.uniqueBots,
          },
          {
            label: "Avg Daily Visits",
            value: Math.round(loaderData.totalVisits / days).toLocaleString(),
          },
        ].map(({ label, value }) => (
          <Card className="bg-secondary-background text-foreground" key={label}>
            <CardContent>
              <div className="text-gray-600 text-sm">{label}</div>
              <div className="font-bold text-2xl">{value}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="bg-secondary-background text-foreground">
        <CardHeader>
          <CardTitle>Traffic Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={loaderData.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) =>
                  DateTime.fromJSDate(new Date(value)).toFormat("MMM d")
                }
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) =>
                  DateTime.fromJSDate(new Date(value as string)).toFormat("PPP")
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#111111"
                strokeWidth={2}
                name="Total Visits"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-secondary-background text-foreground">
        <CardHeader>
          <CardTitle>Recent Bot Activity (7 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <BotStatsTable data={loaderData.recentBotStats} />
        </CardContent>
      </Card>

      <Card className="bg-secondary-background text-foreground">
        <CardHeader>
          <CardTitle>Most Visited Paths (7 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <PathStatsTable data={loaderData.topPaths} />
        </CardContent>
      </Card>
    </section>
  );
}

function BotStatsTable({
  data,
}: {
  data: { botType: string; total: number; uniquePaths: number }[];
}) {
  const table = useReactTable({
    columns: [
      {
        accessorKey: "botType",
        header: "Bot Type",
        size: 300,
      },
      {
        accessorKey: "total",
        header: "Total Visits",
        cell: ({ row }) => row.original.total.toLocaleString(),
        size: 150,
      },
      {
        accessorKey: "uniquePaths",
        header: "Unique Paths",
        size: 150,
      },
    ],
    data,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { sorting: [{ id: "total", desc: true }] },
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id}>
            {group.headers.map((header) => (
              <TableHead
                key={header.id}
                style={{ width: header.column.getSize() }}
              >
                {header.getContext().column.getCanSort() ? (
                  <button
                    className="flex w-full justify-between p-2 font-bold"
                    onClick={header.column.getToggleSortingHandler()}
                    type="button"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {header.column.getIsSorted() === "desc" ? (
                      <ArrowDown />
                    ) : header.column.getIsSorted() === "asc" ? (
                      <ArrowUp />
                    ) : (
                      <span />
                    )}
                  </button>
                ) : (
                  flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id} className="hover:bg-gray-100">
            {row.getVisibleCells().map((cell) => (
              <TableCell
                key={cell.id}
                style={{ maxWidth: cell.column.getSize() }}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PathStatsTable({
  data,
}: {
  data: { path: string; count: number; uniqueBots: number }[];
}) {
  const table = useReactTable({
    columns: [
      {
        accessorKey: "path",
        header: "Path",
        size: 400,
      },
      {
        accessorKey: "count",
        header: "Total Visits",
        cell: ({ row }) => row.original.count.toLocaleString(),
        size: 150,
      },
      {
        accessorKey: "uniqueBots",
        header: "Unique Bots",
        size: 150,
      },
    ],
    data,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { sorting: [{ id: "count", desc: true }] },
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id}>
            {group.headers.map((header) => (
              <TableHead
                key={header.id}
                style={{ width: header.column.getSize() }}
              >
                {header.getContext().column.getCanSort() ? (
                  <button
                    className="flex w-full justify-between p-2 font-bold"
                    onClick={header.column.getToggleSortingHandler()}
                    type="button"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {header.column.getIsSorted() === "desc" ? (
                      <ArrowDown />
                    ) : header.column.getIsSorted() === "asc" ? (
                      <ArrowUp />
                    ) : (
                      <span />
                    )}
                  </button>
                ) : (
                  flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id} className="hover:bg-gray-100">
            {row.getVisibleCells().map((cell) => (
              <TableCell
                key={cell.id}
                style={{ maxWidth: cell.column.getSize() }}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

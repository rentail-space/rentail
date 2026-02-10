import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { groupBy, sumBy } from "es-toolkit";
import { ArrowDown, ArrowUp } from "lucide-react";
import { DateTime } from "luxon";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { ChartContainer } from "~/components/ui/Chart";
import DateRangeSelector, {
  parseDateRange,
  useRangeSelection,
} from "~/components/ui/DateRangeSelector";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/Table";
import prisma from "~/lib/prisma.server";
import { verifyAdmin } from "~/lib/sessions.server";
import type { Route } from "./+types/admin.bots";

export async function loader({ request }: Route.LoaderArgs) {
  await verifyAdmin(request.headers);

  const { period } = parseDateRange(new URL(request.url).searchParams);

  const { recentBotActivity, topPaths } = await getRecentBotActivity({
    limit: 20,
    pastDays: 7,
  });
  const { chartData, topBots, botTotals } = await getBotTotals({
    period,
    limit: 10,
  });

  return {
    chartData,
    topBots,
    recentBotActivity,
    topPaths,
    totalVisits: sumBy(Object.values(botTotals), (total) => total),
    uniqueBots: Object.keys(botTotals).length,
  };
}

async function getBotTotals({
  period,
  limit,
}: {
  period: number;
  limit: number;
}) {
  const today = DateTime.utc().startOf("day");
  // Get all bot visits in date range
  const visits = await prisma.botVisit.findMany({
    where: {
      date: {
        gte: today.minus({ days: period }).toJSDate(),
        lte: today.toJSDate(),
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
    .slice(0, limit)
    .map(([botType]) => botType);

  // Chart data: Daily totals + breakdown by top bots
  const chartData = Object.keys(dailyByBot)
    .sort()
    .map((date) => ({
      date,
      total: sumBy(Object.values(dailyByBot[date]), (count) => count),
      ...Object.fromEntries(
        topBots.map((bot) => [bot, dailyByBot[date][bot] || 0]),
      ),
    }));

  return { chartData, topBots, botTotals };
}

async function getRecentBotActivity({
  pastDays,
  limit,
}: {
  pastDays: number;
  limit: number;
}) {
  const recentVisits = await prisma.botVisit.findMany({
    where: {
      date: {
        gte: DateTime.utc().minus({ days: pastDays }).startOf("day").toJSDate(),
      },
    },
    orderBy: [{ date: "desc" }, { count: "desc" }],
  });

  const recentByBot = recentVisits.reduce<
    Record<
      string,
      {
        botType: string;
        total: number;
        paths: Set<string>;
        accept: string | null;
        referer: string | null;
      }
    >
  >((acc, visit) => {
    if (!acc[visit.botType]) {
      acc[visit.botType] = {
        accept: visit.accept,
        botType: visit.botType,
        referer: visit.referer,
        total: 0,
        paths: new Set<string>(),
      };
    }
    acc[visit.botType].total += visit.count;
    acc[visit.botType].paths.add(visit.path);
    return acc;
  }, {});

  const recentBotActivity = Object.values(recentByBot)
    .map((bot) => ({
      botType: bot.botType,
      total: bot.total,
      uniquePaths: bot.paths.size,
      accept: bot.accept,
      referer: bot.referer,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

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
    .slice(0, limit);

  return { recentBotActivity, topPaths };
}

export default function BotsPage({ loaderData }: Route.ComponentProps) {
  const { period } = useRangeSelection();

  return (
    <main className="space-y-4">
      <h1 className="text-center font-bold text-2xl">Bot Traffic</h1>

      <DateRangeSelector />

      <section className="space-y-4">
        <div className="mb-6 grid grid-cols-3 gap-4">
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
              value: Math.round(
                loaderData.totalVisits / period,
              ).toLocaleString(),
            },
          ].map(({ label, value }) => (
            <Card
              className="bg-secondary-background text-foreground"
              key={label}
            >
              <CardContent>
                <div className="text-gray-600 text-sm">{label}</div>
                <div className="font-bold text-2xl">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-secondary-background text-foreground">
          <CardHeader>
            <CardTitle>Traffic Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                total: {
                  label: "Total Visits",
                  color: "#111111",
                },
              }}
              className="h-40 w-full"
            >
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
                    DateTime.fromJSDate(new Date(value as string)).toFormat(
                      "PPP",
                    )
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
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-secondary-background text-foreground">
          <CardHeader>
            <CardTitle>Recent Bot Activity (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentBotActivityTable data={loaderData.recentBotActivity} />
          </CardContent>
        </Card>

        <Card className="bg-secondary-background text-foreground">
          <CardHeader>
            <CardTitle>Most Visited Paths (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <MostVisitedTable data={loaderData.topPaths} />
          </CardContent>
        </Card>

        <Card className="bg-secondary-background text-foreground">
          <CardHeader>
            <CardTitle>Accepts Header</CardTitle>
          </CardHeader>
          <CardContent>
            <AcceptsTable recentBotActivity={loaderData.recentBotActivity} />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function RecentBotActivityTable({
  data,
}: {
  data: {
    botType: string;
    total: number;
    uniquePaths: number;
    accept: string | null;
    referer: string | null;
  }[];
}) {
  const table = useReactTable({
    columns: [
      {
        accessorKey: "botType",
        header: "Bot Type",
        size: 200,
      },
      {
        accessorKey: "accept",
        header: "Accept",
        size: 200,
      },
      {
        accessorKey: "referer",
        header: "Referer",
        size: 200,
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
                className="truncate"
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

function MostVisitedTable({
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

function AcceptsTable({
  recentBotActivity,
}: {
  recentBotActivity: { accept: string | null; total: number }[];
}) {
  const accepts = Object.entries(
    groupBy(recentBotActivity, ({ accept }) => accept || "Unknown"),
  ).map(([accept, activity]) => ({
    accept,
    total: sumBy(activity, ({ total }) => total),
  }));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Accept</TableHead>
          <TableHead>Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {accepts.map(({ accept, total }) => (
          <TableRow key={accept}>
            <TableCell>{accept}</TableCell>
            <TableCell>{total.toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

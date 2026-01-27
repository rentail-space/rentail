import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { meanBy, sumBy } from "es-toolkit";
import { DateTime } from "luxon";
import { useState } from "react";
import { type LoaderFunctionArgs, useSearchParams } from "react-router";
import { Button } from "~/components/ui/Button";
import { Card, CardContent } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/Table";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/Tabs";
import {
  type SearchQuery,
  getSearchAnalytics,
} from "~/lib/googleSearchConsole";
import prisma from "~/lib/prisma";
import { verifyAdmin } from "~/lib/sessions.server";
import type { Route } from "./+types/admin.searches";

export async function loader({ request }: LoaderFunctionArgs) {
  await verifyAdmin(request.headers);

  const searchParams = new URL(request.url).searchParams;
  const days = parseDays(searchParams);

  const endDate = DateTime.utc();
  const startDate = endDate.minus({ days });

  const key = `search-console:${days}:${startDate.toISODate()}`;
  // Check cache
  let queries = await getCachedQueries(key);
  if (!queries) {
    // Fetch from API
    queries = await getSearchAnalytics({
      startDate: startDate.toJSDate(),
      endDate: endDate.toJSDate(),
    });

    // Cache for 1 hour
    if (queries.length > 0) {
      const expiresAt = DateTime.utc().plus({ hours: 1 }).toJSDate();
      await prisma.cache.upsert({
        where: { key: key },
        create: { key: key, value: JSON.stringify(queries), expiresAt },
        update: { value: JSON.stringify(queries), expiresAt },
      });
    }
  }

  // Calculate summary metrics
  const summary = {
    avgCtr: meanBy(queries, (query) => query.ctr),
    avgPosition: meanBy(queries, (query) => query.position),
    totalClicks: sumBy(queries, (query) => query.clicks),
    totalImpressions: sumBy(queries, (query) => query.impressions),
  };

  return { days, queries, summary };
}

function parseDays(searchParams: URLSearchParams): number {
  const daysParam = searchParams.get("days");
  const days = Number.parseInt(daysParam ?? "30", 10);
  // Validate to only allow 30, 60, or 90
  if (days === 60 || days === 90) return days;
  return 30;
}

async function getCachedQueries(key: string): Promise<SearchQuery[] | null> {
  const cached = await prisma.cache.findUnique({ where: { key: key } });

  if (!cached) return null;
  if (cached.expiresAt && cached.expiresAt < new Date()) {
    // Expired, delete it
    await prisma.cache.delete({ where: { key: key } });
    return null;
  }
  return typeof cached.value === "string"
    ? (JSON.parse(cached.value) as SearchQuery[])
    : (cached.value as unknown as SearchQuery[]);
}

const columns: ColumnDef<SearchQuery>[] = [
  {
    accessorKey: "query",
    header: "Query",
  },
  {
    accessorKey: "impressions",
    header: "Impressions",
    size: 100,
  },
  {
    accessorKey: "clicks",
    header: "Clicks",
    size: 80,
  },
  {
    accessorFn: (row) => `${(row.ctr * 100).toFixed(2)}%`,
    accessorKey: "ctr",
    header: "CTR %",
    size: 80,
  },
  {
    accessorFn: (row) => row.position.toFixed(1),
    accessorKey: "position",
    header: "Position",
    size: 80,
  },
];

export default function SearchesPage({ loaderData }: Route.ComponentProps) {
  const [_searchParams, setSearchParams] = useSearchParams();
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "impressions", desc: true },
  ]);

  const { queries, summary, days } = loaderData;

  const table = useReactTable({
    data: queries,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = row.getValue("query") as string;
      return query.toLowerCase().includes(filterValue.toLowerCase());
    },
  });

  const setDays = (newDays: number) => {
    setSearchParams(
      (params) => {
        params.set("days", newDays.toString());
        return params;
      },
      { replace: true },
    );
  };

  return (
    <section className="flex flex-col gap-8">
      <h1 className="font-bold text-2xl">Search Console Analytics</h1>

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

      <section className="mb-6 grid grid-cols-4 gap-4">
        {[
          {
            label: "Total Impressions",
            value: summary.totalImpressions.toLocaleString(),
          },
          {
            label: "Total Clicks",
            value: summary.totalClicks.toLocaleString(),
          },
          { label: "Avg CTR", value: `${(summary.avgCtr * 100).toFixed(2)}%` },
          { label: "Avg Position", value: summary.avgPosition.toFixed(1) },
        ].map(({ label, value }) => (
          <Card className="bg-secondary-background text-foreground" key={label}>
            <CardContent>
              <div className="text-gray-600 text-sm">{label}</div>
              <div className="font-bold text-2xl">{value}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <form
        method="get"
        action="/api/searches/export"
        className="mb-4 flex items-center justify-between"
      >
        <Input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Filter by query..."
          className="w-96"
        />
        <input type="hidden" name="days" value={days} />
        <Button type="submit" variant="default">
          Export CSV
        </Button>
      </form>

      <Table className="w-full">
        <TableHeader className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="cursor-pointer border-b px-4 py-3 text-left font-semibold text-gray-700 text-sm hover:bg-gray-100"
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ width: header.column.getSize() }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                  {{
                    asc: " 🔼",
                    desc: " 🔽",
                  }[header.column.getIsSorted() as string] ?? null}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        <TableCaption>
          Showing {table.getRowModel().rows.length} of {queries.length} queries
        </TableCaption>
      </Table>
    </section>
  );
}

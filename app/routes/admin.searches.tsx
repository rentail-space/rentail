import type { InputJsonValue } from "@prisma/client/runtime/client";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Temporal } from "@js-temporal/polyfill";
import { daysAgo } from "~/lib/temporal";
import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader } from "~/components/ui/Card";
import DateRangeSelector, {
  parseDateRange,
} from "~/components/ui/DateRangeSelector";
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
import {
  type SearchQuery,
  getSearchAnalytics,
} from "~/lib/googleSearchConsole";
import prisma from "~/lib/prisma.server";
import { verifyAdmin } from "~/lib/sessions.server";
import type { Route } from "./+types/admin.searches";

export async function loader({ request }: Route.LoaderArgs) {
  await verifyAdmin(request.headers);

  const { period } = parseDateRange(new URL(request.url).searchParams);

  const endDate = Temporal.Now.zonedDateTimeISO("UTC");
  const startDate = endDate.subtract({ days: period });
  const key = `search-console:${period}:${startDate.toPlainDate().toString()}`;

  const from10DaysAgo = daysAgo(10);
  const cached = await prisma.cache.findUnique({
    where: { key, createdAt: { gte: from10DaysAgo } },
  });
  let queries: SearchQuery[];

  if (cached) {
    queries =
      typeof cached.value === "string"
        ? (JSON.parse(cached.value) as SearchQuery[])
        : (cached.value as unknown as SearchQuery[]);
  } else {
    queries = await getSearchAnalytics({
      startDate: new Date(startDate.epochMilliseconds),
      endDate: new Date(endDate.epochMilliseconds),
    });

    if (queries.length > 0) {
      const value = queries as unknown as InputJsonValue;
      await prisma.cache.upsert({
        create: { key, value },
        update: { value },
        where: { key },
      });
    }
  }

  const { meanBy, sumBy } = await import("es-toolkit");
  const summary = {
    avgCtr: meanBy(queries, (query) => query.ctr),
    avgPosition: meanBy(queries, (query) => query.position),
    totalClicks: sumBy(queries, (query) => query.clicks),
    totalImpressions: sumBy(queries, (query) => query.impressions),
  };

  return { queries, summary };
}

const columns: ColumnDef<SearchQuery>[] = [
  { accessorKey: "query", header: "Query" },
  { accessorKey: "impressions", header: "Impressions", size: 100 },
  { accessorKey: "clicks", header: "Clicks", size: 80 },
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
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "impressions", desc: true },
  ]);

  const { queries, summary } = loaderData;

  const table = useReactTable({
    data: queries,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _, filterValue) => {
      const query = row.getValue("query") as string;
      return query.toLowerCase().includes(filterValue.toLowerCase());
    },
  });

  return (
    <main className="space-y-4">
      <h1 className="text-center font-bold text-2xl">
        Search Console Analytics
      </h1>

      <section className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: "Total Impressions",
              value: summary.totalImpressions.toLocaleString(),
            },
            {
              label: "Total Clicks",
              value: summary.totalClicks.toLocaleString(),
            },
            {
              label: "Avg CTR",
              value: `${(summary.avgCtr * 100).toFixed(2)}%`,
            },
            { label: "Avg Position", value: summary.avgPosition.toFixed(1) },
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
            <form
              method="get"
              action="/api/searches/export"
              className="mb-4 flex items-center justify-between"
            >
              <DateRangeSelector />
              <Input
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Filter by query..."
                className="w-96"
              />
              <Button type="submit" variant="default">
                Export CSV
              </Button>
            </form>
          </CardHeader>
          <CardContent>
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
                        {{ asc: " 🔼", desc: " 🔽" }[
                          header.column.getIsSorted() as string
                        ] ?? null}
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
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>
                Showing {table.getRowModel().rows.length} of {queries.length}{" "}
                queries
              </TableCaption>
            </Table>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { groupBy, mean, median, orderBy, sortBy, sum } from "es-toolkit";
import { DateTime } from "luxon";
import { useMemo } from "react";
import { Card, CardContent } from "~/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/Table";

export default function RecentVisibility({
  visibility,
}: {
  visibility: {
    category: string;
    citations: string[];
    query: string;
    createdAt: Date;
  }[];
}) {
  const groupedByDate = useMemo(
    () =>
      Object.entries(
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
      })),
    [visibility],
  );
  const mostRecentQueries = useMemo(
    () =>
      orderBy(Object.entries(groupedByDate), [([date]) => date], ["asc"])[0][1],
    [groupedByDate],
  );

  const table = useReactTable({
    columns: [
      {
        accessorKey: "category",
        cell: ({ row }) => (
          <span className="font-bold">{row.original.category}</span>
        ),
        header: "Query ID",
        size: 120,
        footer: DateTime.fromISO(mostRecentQueries.date).toFormat("yyyy-MM-dd"),
      },
      {
        accessorKey: "query",
        header: "Query",
        size: 600,
      },
      {
        accessorFn: (row) => row.rentail,
        aggregationFn: "mean",
        cell: ({ row }) => (
          <span>
            {row.original.rentail} / {row.original.citations.length}
          </span>
        ),
        header: "Citations",
        size: 60,
      },
      {
        accessorFn: (row) => row.score,
        aggregationFn: "sum",
        header: "Score",
        size: 60,
      },
    ],
    data: sortBy(mostRecentQueries.queries, ["category", "query"]),
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card className="bg-secondary-background text-foreground">
      <CardContent>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.column.getSize() }}
                    className="whitespace-nowrap font-bold"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
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

          <TableFooter>
            {table.getFooterGroups().map((footerGroup) => (
              <TableRow key={footerGroup.id}>
                {footerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {(() => {
                      const values = table
                        .getRowModel()
                        .flatRows.filter(
                          (row) => row.columnFilters[header.column.id] ?? true,
                        )
                        .map((row) => row.getValue(header.column.id) as number);
                      switch (header.column.columnDef.aggregationFn) {
                        case "min":
                          return Math.min(...values).toFixed(2);
                        case "max":
                          return Math.max(...values).toFixed(2);
                        case "mean":
                          return mean(values).toLocaleString();
                        case "median":
                          return median(values).toLocaleString();
                        case "sum":
                          return sum(values).toLocaleString();
                        case "count":
                          return values.length.toLocaleString();
                        default:
                          return header.column.columnDef.footer?.toString();
                      }
                    })()}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
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

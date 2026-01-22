import {
  flexRender,
  getCoreRowModel,
  getGroupedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { groupBy, last, mean, median, sum } from "es-toolkit";
import { DateTime } from "luxon";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/Table";
import prisma from "~/lib/prisma";
import { verifyAdmin } from "~/lib/sessions.server";
import type { Route } from "./+types/admin.visibility";

export async function loader({ request }: Route.LoaderArgs) {
  await verifyAdmin(request.headers);

  const visibility = await prisma.visibilityCheck.findMany({
    orderBy: { createdAt: "desc" },
    where: {
      createdAt: { gte: DateTime.now().minus({ days: 30 }).toJSDate() },
    },
  });
  return { visibility };
}

export default function VisibilityPage({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  const grouped = groupBy(loaderData.visibility, (visibility) =>
    DateTime.fromJSDate(visibility.createdAt).toFormat("yyyy-MM-dd"),
  );
  const table = useReactTable({
    columns: [
      {
        accessorKey: "queryId",
        cell: ({ row }) => (
          <span className="font-bold">{row.original.queryId}</span>
        ),
        enableGrouping: false,
        header: "Query ID",
        size: 60,
      },
      {
        accessorKey: "query",
        enableGrouping: false,
        header: "Query",
        size: 600,
      },
      {
        accessorFn: (row) =>
          row.citations.filter(
            (citation) => new URL(citation).hostname === "rentail.space",
          ).length,
        aggregationFn: "mean",
        cell: ({ row, getValue }) => (
          <span>
            {getValue()}/{row.original.citations.length}
          </span>
        ),
        enableGrouping: true,
        header: "Citations",
        size: 60,
      },
      {
        accessorFn: (row) => scoreCitations(row.citations),
        aggregationFn: "mean",
        enableGrouping: true,
        header: "Score",
        size: 60,
      },
    ],
    data: last(Object.values(grouped)) ?? [],
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
  });

  return (
    <section className="flex flex-col gap-8">
      <h1 className="font-bold text-2xl">Recent Visibility Checks</h1>
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
                        return mean(values).toFixed(2);
                      case "median":
                        return median(values).toFixed(2);
                      case "sum":
                        return sum(values).toFixed(2);
                      case "count":
                        return values.length.toString();
                      default:
                        return null;
                    }
                  })()}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableFooter>
      </Table>
    </section>
  );
}

function scoreCitations(citations: string[]): number {
  const isRentail = citations.filter(
    (citation) => new URL(citation).hostname === "rentail.space",
  );
  const isFirstPlace =
    citations.length > 0 && new URL(citations[0]).hostname === "rentail.space";
  return (isFirstPlace ? 50 : 0) + isRentail.length * 10;
}

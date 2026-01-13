import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { groupBy } from "node_modules/es-toolkit/dist/array/groupBy.mjs";
import { sumBy } from "node_modules/es-toolkit/dist/math/sumBy.mjs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/Table";
import { cn } from "~/lib/utils";
import type { loader } from "./route";

export default function Sources({
  analytics,
}: {
  analytics: Awaited<ReturnType<typeof loader>>["analytics"];
}) {
  const grouped = groupBy(
    analytics,
    (entry: { sessionSource: string }) => entry.sessionSource,
  );
  const total = sumBy(Object.values(analytics), (entry) => entry.visitors);
  const table = useReactTable({
    columns: [
      {
        accessorKey: "source",
        header: "Source",
        size: 900,
      },
      {
        accessorKey: "visitors",
        header: "Visitors",
        meta: { align: "right" },
        size: 80,
      },
      {
        accessorFn: (row) => `${row.percentage.toFixed(2)}%`,
        accessorKey: "percentage",
        header: "Percentage",
        meta: { align: "right" },
        size: 80,
      },
    ],
    data: Object.entries(grouped).map(([source, entries]) => ({
      source,
      visitors: sumBy(entries, (entry) => entry.visitors),
      percentage: (sumBy(entries, (entry) => entry.visitors) / total) * 100,
    })),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { sorting: [{ id: "visitors", desc: true }] },
  });

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-bold text-2xl">
        Sources{" "}
        <span className="text-gray-500">
          ({sumBy(Object.values(analytics), (entry) => entry.visitors)} visitors
          / {Object.keys(grouped).length} sources)
        </span>
      </h2>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{ width: header.column.getSize() }}
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
                  className={cn(
                    "truncate",
                    cell.column.columnDef.meta &&
                      "align" in cell.column.columnDef.meta &&
                      cell.column.columnDef.meta.align === "right"
                      ? "text-right"
                      : "",
                  )}
                  key={cell.id}
                  style={{ maxWidth: cell.column.getSize() }}
                  title={cell.getValue() as string}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { groupBy } from "node_modules/es-toolkit/dist/array/groupBy.mjs";
import { sumBy } from "node_modules/es-toolkit/dist/math/sumBy.mjs";
import { Suspense } from "react";
import { Await } from "react-router";
import { twMerge } from "tailwind-merge";
import { Card, CardContent } from "~/components/ui/Card";
import LoadingProgress from "~/components/ui/LoadingProgress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/Table";
import type { Analytics } from "./route";

export default function UserSources({
  analytics,
}: {
  analytics: Promise<Analytics[]>;
}) {
  return (
    <Card className="bg-secondary-background text-foreground">
      <CardContent>
        <Suspense fallback={<LoadingProgress />}>
          <Await resolve={analytics}>
            {(analytics) => <SourcesTable analytics={analytics} />}
          </Await>
        </Suspense>
      </CardContent>
    </Card>
  );
}

function SourcesTable({ analytics }: { analytics: Analytics[] }) {
  const grouped = groupBy(analytics, ({ sessionSource }) => sessionSource);
  const totalVisitors = sumBy(
    Object.values(analytics),
    (entry) => entry.visitors,
  );
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
        size: 80,
      },
      {
        accessorFn: (row) => `${row.percentage.toFixed(2)}%`,
        accessorKey: "percentage",
        header: "Percentage",
        size: 80,
      },
    ],
    data: Object.entries(grouped).map(([source, entries]) => ({
      source,
      visitors: sumBy(entries, ({ visitors }) => visitors),
      percentage:
        (sumBy(entries, ({ visitors }) => visitors) / totalVisitors) * 100,
    })),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { sorting: [{ id: "visitors", desc: true }] },
  });

  return (
    <section>
      <h2 className="font-bold text-lg">
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
                  className="whitespace-nowrap font-bold"
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
                  className={twMerge(
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

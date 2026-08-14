import type { Analytics } from "./route";
import { Card, CardContent } from "~/components/ui/Card";
import { groupBy, sumBy } from "es-toolkit";
import { twMerge } from "tailwind-merge";
import {
  TableHeader,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Table,
} from "~/components/ui/Table";
import {
  columnSizingFeature,
  createSortedRowModel,
  flexRender,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";

export default function UserSources({ analytics }: { analytics: Analytics[] }) {
  return (
    <Card className="bg-secondary-background text-foreground">
      <CardContent>
        <SourcesTable analytics={analytics} />
      </CardContent>
    </Card>
  );
}

const features = tableFeatures({
  rowSortingFeature,
  columnSizingFeature,
  sortedRowModel: createSortedRowModel(),
});

function SourcesTable({ analytics }: { analytics: Analytics[] }) {
  const grouped = groupBy(analytics, ({ sessionSource }) => sessionSource);
  const totalVisitors = sumBy(
    Object.values(analytics),
    (entry) => entry.visitors,
  );
  const table = useTable({
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
    features,
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
              {row.getAllCells().map((cell) => (
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

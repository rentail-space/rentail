import {
  flexRender,
  getCoreRowModel,
  getGroupedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { mean, median, sortBy, sum } from "es-toolkit";
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
  queries,
}: {
  queries: {
    category: string;
    query: string;
    citations: string[];
    score: number;
    ratio: number;
    rentail: number;
  }[];
}) {
  const table = useReactTable({
    columns: [
      {
        accessorKey: "category",
        cell: ({ row }) => (
          <span className="font-bold">{row.original.category}</span>
        ),
        enableGrouping: false,
        header: "Query ID",
        size: 120,
      },
      {
        accessorKey: "query",
        enableGrouping: false,
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
        enableGrouping: true,
        header: "Citations",
        size: 60,
      },
      {
        accessorFn: (row) => row.score,
        aggregationFn: "mean",
        enableGrouping: true,
        header: "Score",
        size: 60,
      },
    ],
    data: sortBy(queries, ["category", "query"]),
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
  });

  return (
    <section>
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

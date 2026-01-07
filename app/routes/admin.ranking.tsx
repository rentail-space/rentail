import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, EqualIcon } from "lucide-react";
import { Form } from "react-router";
import { ActiveLink } from "~/components/ui/ActiveLink";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/Table";
import findNearbyCenters from "~/lib/findNearbyCenters";
import type { Route } from "./+types/admin.centers";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const location = url.searchParams.get("location") ?? undefined;
  const { centers, displayName } = await findNearbyCenters({
    headers: new Headers(),
    limit: 10,
    location,
  });
  return { centers, displayName, location };
}

export default function RankingPage({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  const table = useReactTable({
    columns: [
      {
        accessorKey: "name",
        cell: ({ row }) => (
          <ActiveLink to={`/center/${row.original.id}`}>
            {row.original.name}
          </ActiveLink>
        ),
        header: "Shopping Center",
        size: 600,
      },
      { accessorKey: "city", size: 140, header: "City" },
      { accessorKey: "state", header: "State", size: 80 },
      {
        accessorFn: (row) => row.spaces.length,
        accessorKey: "spaces",
        header: "Spaces",
        size: 80,
      },
      {
        accessorKey: "ranking",
        cell: ({ row }) => (
          <span className="flex flex-row justify-between gap-2">
            <span>
              {row.original.rating} * log(
              {row.original.reviewCount?.toLocaleString()}) *{" "}
              {row.original.tier}
            </span>
            <EqualIcon className="h-4 w-4" />
            <span>{row.original.ranking}</span>
          </span>
        ),
        header: "Ranking",
        size: 220,
      },
    ],
    data: loaderData.centers,
    debugTable: true,
    enableSortingRemoval: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { sorting: [] },
  });

  return (
    <section className="flex flex-col gap-4">
      <Form
        action="/admin/ranking"
        className="flex items-center gap-2"
        method="get"
      >
        <Input
          defaultValue={loaderData.location}
          name="location"
          type="search"
        />
        <Button type="submit">Search</Button>
      </Form>

      <p className="text-gray-500 text-lg">
        {loaderData.displayName || "no location"}
      </p>

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
                        <ArrowUp />
                      ) : header.column.getIsSorted() === "asc" ? (
                        <ArrowDown />
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

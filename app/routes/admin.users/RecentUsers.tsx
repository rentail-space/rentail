import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, LockIcon, UserIcon } from "lucide-react";
import type { User } from "prisma/generated/client";
import { ActiveLink } from "~/components/ui/ActiveLink";
import { Button } from "~/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/Table";
import deviceDetection from "~/lib/deviceDetection";
import { humanDate } from "~/lib/time";

export default function AllUsers({ users }: { users: User[] }) {
  const table = useReactTable({
    columns: [
      {
        accessorKey: "name",
        cell: ({ row }) => (
          <ActiveLink to={`/admin/user/${row.original.id}`}>
            {row.original.isAnonymous ? (
              <UserIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <LockIcon className="h-4 w-4" />
            )}
            {row.original.name || row.original.id}
          </ActiveLink>
        ),
        header: "Name",
        size: 240,
      },
      {
        accessorFn: (row) => deviceDetection(row.userAgent),
        enableResizing: true,
        header: "Device",
        size: 120,
      },
      {
        accessorFn: (row) =>
          (row.utm && JSON.parse(row.utm as string).source) ||
          row.referrer ||
          "N/A",
        size: 280,
        header: "Source",
      },
      {
        accessorKey: "ip",
        header: "IP",
        size: 120,
        sortingFn: "alphanumeric",
      },
      {
        accessorKey: "createdAt",
        cell: ({ row }) => humanDate(row.original.createdAt),
        header: "Created",
        size: 140,
        sortingFn: (rowA, rowB) =>
          rowA.original.createdAt.getTime() - rowB.original.createdAt.getTime(),
      },
    ],
    columnResizeMode: "onChange",
    data: users,
    debugTable: true,
    defaultColumn: {
      minSize: 100,
      maxSize: 400,
    },
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { sorting: [{ id: "createdAt", desc: true }] },
  });

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-bold text-2xl">
        All Users <span className="text-gray-500">({users.length} user)</span>
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
                  <Button
                    className="flex w-full cursor-col-resize justify-between p-2"
                    onClick={header.column.getToggleSortingHandler()}
                    onDoubleClick={() => header.column.resetSize()}
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    variant="ghost"
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
                  </Button>
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

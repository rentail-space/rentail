import {
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, NotepadTextIcon } from "lucide-react";
import { Fragment, useState } from "react";
import { Link, type LoaderFunctionArgs } from "react-router";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import prisma from "~/lib/prisma";
import { verifyAdmin } from "~/sessions.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await verifyAdmin(request.headers);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    where: { isBot: false },
  });
  return { users };
}

export default function UsersPage({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const table = useReactTable({
    columns: [
      {
        header: "Name",
        accessorKey: "name",
        cell: ({ row }) => (
          <Link
            to={`/admin/user/${row.original.id}`}
            className="link link-primary"
          >
            {row.original.name || row.original.id}
          </Link>
        ),
        size: 150,
      },
      { header: "Email", accessorKey: "email", size: 150 },
      { header: "User Agent", accessorKey: "userAgent", size: 150 },
      { header: "Referrer", accessorKey: "referrer", size: 150 },
      { header: "IP", accessorKey: "ip", size: 110 },
      {
        header: "Created",
        accessorKey: "createdAt",
        accessorFn: (row) =>
          row.createdAt.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
        size: 110,
      },
    ],
    data: loaderData.users,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id}>
            {group.headers.map((header) => (
              <TableHead key={header.id}>
                <Button
                  onClick={header.column.getToggleSortingHandler()}
                  variant="ghost"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                  <ArrowUpDown />
                </Button>
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <Fragment key={row.id}>
            <TableRow>
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  className="truncate whitespace-nowrap"
                  key={cell.id}
                  style={{ maxWidth: cell.column.columnDef.size }}
                  title={cell.getValue() as string}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell />
              <TableCell colSpan={row.getVisibleCells().length - 1}>
                <div className="flex max-w-[900px] items-center gap-2">
                  <NotepadTextIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate" title={row.original.note ?? ""}>
                    {row.original.note ?? "No note"}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}

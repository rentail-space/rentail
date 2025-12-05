import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { User, Waitlist } from "prisma/generated/client";
import { Fragment } from "react";
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
import type { Route } from "./+types/admin.users";

export async function loader({ request }: LoaderFunctionArgs) {
  await verifyAdmin(request.headers);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    where: { isBot: false },
  });

  const waiting = await prisma.waitlist.findMany();
  return { users, waiting };
}

export default function UsersPage({ loaderData }: Route.ComponentProps) {
  return (
    <main className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="font-bold text-2xl">
          All Users{" "}
          <span className="text-gray-500">({loaderData.users.length})</span>
        </h2>
        <AllUsers users={loaderData.users} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-bold text-2xl">
          Waiting List{" "}
          <span className="text-gray-500">({loaderData.waiting.length})</span>
        </h2>
        <WaitingList waiting={loaderData.waiting} />
      </section>
    </main>
  );
}

function AllUsers({ users }: { users: User[] }) {
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
        size: 180,
      },
      { header: "Email", accessorKey: "email", size: 180 },
      { header: "User Agent", accessorKey: "userAgent", size: 180 },
      { header: "Referrer", accessorKey: "referrer", size: 180 },
      {
        header: "IP",
        accessorKey: "ip",
        size: 90,
        sortingFn: "alphanumeric",
      },
      {
        header: "Created",
        accessorKey: "createdAt",
        accessorFn: (row) =>
          row.createdAt.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
        sortingFn: (rowA, rowB) =>
          rowA.original.createdAt.getTime() - rowB.original.createdAt.getTime(),
        size: 120,
      },
    ],
    data: users,
    debugTable: true,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { sorting: [{ id: "createdAt", desc: true }] },
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id}>
            {group.headers.map((header) => (
              <TableHead key={header.id}>
                <Button
                  className="flex w-full justify-between"
                  onClick={header.column.getToggleSortingHandler()}
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
                    <>&nbsp;</>
                  )}
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
                  key={cell.id}
                  title={cell.getValue() as string}
                  width={cell.column.getSize()}
                >
                  <div
                    className="truncate"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                </TableCell>
              ))}
            </TableRow>
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}

function WaitingList({ waiting }: { waiting: Waitlist[] }) {
  const table = useReactTable({
    columns: [
      { header: "Email", accessorKey: "email" },
      {
        header: "Created",
        accessorKey: "createdAt",
        sortingFn: (rowA, rowB) =>
          rowA.original.createdAt.getTime() - rowB.original.createdAt.getTime(),
        accessorFn: (row) =>
          row.createdAt.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        size: 140,
      },
    ],
    data: waiting,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { sorting: [{ id: "createdAt", desc: true }] },
  });
  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id}>
            {group.headers.map((header) => (
              <TableHead key={header.id}>
                <Button
                  className="flex w-full justify-between"
                  onClick={header.column.getToggleSortingHandler()}
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
                    <>&nbsp;</>
                  )}
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
                <TableCell key={cell.id} width={cell.column.getSize()}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}

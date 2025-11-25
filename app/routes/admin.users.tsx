import {
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { NotepadTextIcon } from "lucide-react";
import { Fragment, useState } from "react";
import { Link, type LoaderFunctionArgs } from "react-router";
import { twMerge } from "tailwind-merge";
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
            {row.original.name}
          </Link>
        ),
        size: 250,
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
    <table className="table-zebra table">
      <thead>
        {table.getHeaderGroups().map((group) => (
          <tr key={group.id}>
            {group.headers.map((header) => (
              <th key={header.id}>
                <button
                  type="button"
                  className={twMerge(
                    "flex w-full select-none flex-row justify-between gap-2",
                    header.column.getCanSort() && "cursor-pointer",
                  )}
                  onClick={header.column.getToggleSortingHandler()}
                  title={header.column.columnDef.header?.toString()}
                >
                  <span>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </span>
                  <span>
                    {{
                      asc: " 🔼",
                      desc: " 🔽",
                    }[header.column.getIsSorted() as string] ?? null}
                  </span>
                </button>
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <Fragment key={row.id}>
            <tr>
              {row.getVisibleCells().map((cell) => (
                <td
                  className="truncate whitespace-nowrap"
                  key={cell.id}
                  style={{ maxWidth: cell.column.columnDef.size }}
                  title={cell.getValue() as string}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
            <tr>
              <td />
              <td colSpan={row.getVisibleCells().length - 1}>
                <div className="flex max-w-[900px] items-center gap-2">
                  <NotepadTextIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate" title={row.original.note ?? ""}>
                    {row.original.note ?? "No note"}
                  </span>
                </div>
              </td>
            </tr>
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}

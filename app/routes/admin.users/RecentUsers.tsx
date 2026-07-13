import type { User } from "prisma/generated";
import { href } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { cleanParseWorkingMemory } from "~/lib/workingMemory";
import { LockIcon, UserIcon } from "lucide-react";
import { ActiveLink } from "~/components/ui/ActiveLink";
import { humanDate } from "~/lib/time";
import { Button } from "~/components/ui/Button";
import {
  TableHeader,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Table,
} from "~/components/ui/Table";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { safeParseUtm } from "~/lib/utm";
import deviceDetection from "~/lib/deviceDetection";
import { last, round } from "radashi";
import convert from "convert";

export default function RecentUsers({ users }: { users: User[] }) {
  const table = useReactTable({
    columns: [
      {
        cell: ({ row }) => (
          <ActiveLink
            to={href("/admin/user/:userId", { userId: row.original.id })}
          >
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
        header: "Device",
        size: 120,
      },
      {
        accessorFn: (row) =>
          safeParseUtm(row.utm)?.source || row.referrer || "N/A",
        size: 180,
        header: "Source",
      },
      {
        accessorFn: (row) =>
          row.workingMemory
            ? cleanParseWorkingMemory(row.workingMemory).location?.displayName
            : null,
        header: "Location",
        size: 240,
      },
      {
        accessorKey: "createdAt",
        cell: ({ row }) => humanDate(row.original.createdAt, Date.now()),
        header: "Created",
        size: 140,
      },
    ],
    columnResizeMode: "onChange",
    data: users,
    defaultColumn: {
      minSize: 100,
      maxSize: 400,
    },
    getCoreRowModel: getCoreRowModel(),
  });
  const recent = last(users)?.createdAt;
  const days =
    recent && convert(Date.now() - new Date(recent).getTime(), "ms").to("days");

  return (
    <Card className="bg-secondary-background text-foreground">
      <CardHeader>
        <CardTitle className="font-bold text-2xl">
          Recent Users{" "}
          <span className="text-gray-500">
            ({users.length} users
            {days && ` ~${round(users.length / days, 1)} day`})
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent>
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
                      onDoubleClick={() => header.column.resetSize()}
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      variant="ghost"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
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
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

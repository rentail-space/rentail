import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { JWT } from "google-auth-library";
import { google } from "googleapis";
import { ArrowDown, ArrowUp } from "lucide-react";
import { DateTime } from "luxon";
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
import env from "~/lib/env";
import prisma from "~/lib/prisma";
import { verifyAdmin } from "~/sessions.server";
import deviceDetection from "../lib/deviceDetection";
import type { Route } from "./+types/admin.users";

export async function loader({ request }: LoaderFunctionArgs) {
  await verifyAdmin(request.headers);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    where: { isBot: false },
  });

  const waiting = await prisma.waitlist.findMany();
  const analytics = await getGoogleAnalyticsViewCount();
  return { users, waiting, analytics };
}

export default function UsersPage({ loaderData }: Route.ComponentProps) {
  return (
    <main className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="font-bold text-2xl">Analytics</h2>
        <Analytics analytics={loaderData.analytics} users={loaderData.users} />
      </section>

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

function Analytics({
  analytics,
  users,
}: {
  analytics: { activeUsers: string; screenPageViews: string };
  users: User[];
}) {
  const withoutAdmin = users.filter((user) => !user.isAdmin);
  const daysAgo = DateTime.now().minus({ days: 30 }).toJSDate();
  const recentlyUpdated = withoutAdmin.filter(
    (user) => user.updatedAt.getTime() > daysAgo.getTime(),
  );
  const activeUsers = Number(analytics.activeUsers);
  const screenPageViews = Number(analytics.screenPageViews);
  const conversion = recentlyUpdated.length / activeUsers;

  return (
    <div className="stats mx-auto max-w-xl">
      <div className="stat place-items-center">
        <div className="stat-title">Screen Page Views</div>
        <div className="stat-value">{screenPageViews.toLocaleString()}</div>
        <div className="stat-desc">&nbsp;</div>
      </div>
      <div className="stat place-items-center">
        <div className="stat-title">Active Users</div>
        <div className="stat-value">{activeUsers.toLocaleString()}</div>
        <div className="stat-desc">Last 30 days</div>
      </div>
      <div className="stat place-items-center">
        <div className="stat-title">Conversion</div>
        <div className="stat-value flex items-center gap-2">
          {(conversion * 100).toFixed(2)}%
        </div>
        <div className="stat-desc">{recentlyUpdated.length} new users</div>
      </div>
    </div>
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
        size: 280,
      },
      {
        header: "Device",
        accessorFn: (row) => deviceDetection(row.userAgent),
        size: 120,
      },
      { header: "Referrer", accessorKey: "referrer", size: 300 },
      {
        header: "IP",
        accessorKey: "ip",
        size: 120,
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
        size: 110,
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
async function getGoogleAnalyticsViewCount(): Promise<{
  activeUsers: string;
  screenPageViews: string;
}> {
  const auth = new JWT({
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    email: "analytics@rentail-480516.iam.gserviceaccount.com",
    key: env.GOOGLE_ANALYTICS_PRIVATE_KEY,
  });
  const analyticsData = google.analyticsdata({ version: "v1beta", auth });
  const propertyId = "properties/496833933";

  try {
    const response = await analyticsData.properties.runReport({
      property: propertyId,
      requestBody: {
        dateRanges: [
          {
            startDate: "30daysAgo",
            endDate: "today",
          },
        ],
        metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
      },
    });
    const activeUsers =
      response.data.rows?.[0].metricValues?.[0]?.value ?? "N/A";
    const screenPageViews =
      response.data.rows?.[0].metricValues?.[1]?.value ?? "N/A";
    return { activeUsers, screenPageViews };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch GA view count", error);
    return { activeUsers: "N/A", screenPageViews: "N/A" };
  }
}

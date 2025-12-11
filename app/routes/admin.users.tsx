import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { JWT } from "google-auth-library";
import { google } from "googleapis";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { DateTime } from "luxon";
import type { User, Waitlist } from "prisma/generated/client";
import { Fragment } from "react";
import { Link, type LoaderFunctionArgs } from "react-router";
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
import envVars from "~/lib/env";
import prisma from "~/lib/prisma";
import { verifyAdmin } from "~/lib/sessions.server";
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
      <Analytics analytics={loaderData.analytics} users={loaderData.users} />

      <section className="flex flex-col gap-4">
        <h2 className="font-bold text-2xl">
          All Users{" "}
          <span className="text-gray-500">
            ({loaderData.users.length} user)
          </span>
        </h2>
        <AllUsers users={loaderData.users} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-bold text-2xl">
          Waiting List{" "}
          <span className="text-gray-500">
            ({loaderData.waiting.length} waiting)
          </span>
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
  const screenPageViews = Number(analytics.screenPageViews);
  const activeUsers = Number(analytics.activeUsers);
  const withoutAdmin = users.filter((user) => !user.isAdmin);
  const daysAgo = DateTime.now().minus({ days: 30 }).toJSDate();
  const recentlyUpdated = withoutAdmin.filter(
    (user) => user.updatedAt.getTime() > daysAgo.getTime(),
  );
  const signedUp = withoutAdmin.filter((user) => user.passwordHash !== null);

  return (
    <div className="mx-auto flex flex-row items-center gap-4">
      <Stat
        title="Page Views"
        value={screenPageViews.toLocaleString()}
        description="Google Analytics"
      />
      <ArrowRight className="h-6 w-6 text-gray-400" />
      <Stat
        title="Active Users"
        value={activeUsers.toLocaleString()}
        description="Last 30 days"
      />
      <ArrowRight className="h-6 w-6 text-gray-400" />
      <Stat
        title="Conversations"
        value={recentlyUpdated.length.toLocaleString()}
        description={`${((recentlyUpdated.length / activeUsers) * 100).toFixed(2)}% of active`}
      />
      <ArrowRight className="h-6 w-6 text-gray-400" />
      <Stat
        title="Signed Up"
        value={signedUp.length.toLocaleString()}
        description={`${((signedUp.length / recentlyUpdated.length) * 100).toFixed(2)}% of chats`}
      />
    </div>
  );
}

function Stat({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="font-medium text-sm">{title}</div>
      <div className="font-bold text-2xl">{value}</div>
      <div className="text-gray-500 text-sm">{description}</div>
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
            className="text-blue-500 underline hover:decoration-[hsl(37,92%,65%)]"
          >
            {row.original.name || row.original.id}
          </Link>
        ),
        size: 240,
      },
      {
        header: "Device",
        accessorFn: (row) => deviceDetection(row.userAgent),
        size: 120,
      },
      {
        header: "Source / Referrer",
        accessorFn: (row) =>
          (row.utm && JSON.parse(row.utm as string).source) ||
          row.referrer ||
          "N/A",

        size: 350,
      },
      {
        header: "IP",
        accessorKey: "ip",
        size: 100,
        sortingFn: "alphanumeric",
      },
      {
        header: "Created",
        accessorKey: "createdAt",
        accessorFn: (row) =>
          DateTime.fromJSDate(row.createdAt)
            .setZone((row.geocode as { timeZone: string }).timeZone ?? "UTC")
            .toFormat("yyyy-MM-dd HH:mm"),

        sortingFn: (rowA, rowB) =>
          rowA.original.createdAt.getTime() - rowB.original.createdAt.getTime(),
        size: 130,
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
    key: envVars.GOOGLE_ANALYTICS_PRIVATE_KEY,
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

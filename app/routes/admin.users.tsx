import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { sumBy } from "es-toolkit";
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
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/Tabs";
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
  const analytics = await getGoogleAnalyticsViewCount(90);
  return { users, waiting, analytics };
}

async function getGoogleAnalyticsViewCount(days: number): Promise<
  Array<{
    activeUsers: string;
    date: string;
    screenPageViews: string;
  }>
> {
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
            startDate: DateTime.now()
              .minus({ days: 90 })
              .toFormat("yyyy-MM-dd"),
            endDate: "today",
          },
        ],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
      },
    });

    return (
      response.data.rows?.map((row) => ({
        date: row.dimensionValues?.[0]?.value ?? "N/A",
        activeUsers: row.metricValues?.[0]?.value ?? "0",
        screenPageViews: row.metricValues?.[1]?.value ?? "0",
      })) ?? []
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch GA view count", error);
    return [];
  }
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

import { parseAsInteger, useQueryState } from "nuqs";

function Analytics({
  analytics,
  users,
}: {
  analytics: Array<{
    activeUsers: string;
    date: string;
    screenPageViews: string;
  }>;
  users: User[];
}) {
  const [selectedPeriod, setSelectedPeriod] = useQueryState(
    "period",
    parseAsInteger.withDefault(30),
  );
  const daysAgo = DateTime.now()
    .minus({ days: selectedPeriod ?? 30 })
    .toJSDate();
  const selectedData = analytics.filter(
    ({ date }) => DateTime.fromFormat(date, "yyyyMMdd").toJSDate() > daysAgo,
  );
  const activeUsers = sumBy(selectedData, (day) => Number(day.activeUsers));
  const recentlyCreated = users
    .filter(({ isAdmin }) => !isAdmin)
    .filter(({ createdAt }) => createdAt.getTime() > daysAgo.getTime());
  const signedUp = recentlyCreated.filter(
    ({ passwordHash }) => passwordHash !== null,
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Tabs for period selection */}
      <Tabs className="mx-auto" value={selectedPeriod.toString()}>
        <TabsList>
          {[10, 30, 90].map((days) => (
            <TabsTrigger
              key={days}
              value={days.toString()}
              onClick={() => setSelectedPeriod(days)}
            >
              Last {days} Days
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Conversion Funnel */}
      <div className="mx-auto flex flex-row items-center gap-4">
        <Stat
          title="Page Views"
          value={sumBy(selectedData, (day) =>
            Number(day.screenPageViews),
          ).toLocaleString()}
          description="Google Analytics"
        />
        <ArrowRight className="h-6 w-6 text-gray-400" />
        <Stat
          title="Active Users"
          value={activeUsers.toLocaleString()}
          description={`Last ${selectedPeriod} days`}
        />
        <ArrowRight className="h-6 w-6 text-gray-400" />
        <Stat
          title="Conversations"
          value={recentlyCreated.length.toLocaleString()}
          description={`${((recentlyCreated.length / activeUsers) * 100).toFixed(2)}% of active`}
        />
        <ArrowRight className="h-6 w-6 text-gray-400" />
        <Stat
          title="Signed Up"
          value={signedUp.length.toLocaleString()}
          description={`${((signedUp.length / recentlyCreated.length) * 100).toFixed(2)}% of chats`}
        />
      </div>
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

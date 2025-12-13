import { BetaAnalyticsDataClient } from "@google-analytics/data";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { invariant, sumBy } from "es-toolkit";
import { JWT } from "google-auth-library";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { DateTime } from "luxon";
import { parseAsInteger, useQueryState } from "nuqs";
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
  const client = new BetaAnalyticsDataClient({ authClient: auth });

  try {
    const response = await client.runReport({
      dateRanges: [{ endDate: "today", startDate: "30daysAgo" }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
      property: "properties/496833933",
    });
    const rows = response[0].rows;
    invariant(rows, "No rows found");

    return rows.map((row) => ({
      date: row.dimensionValues?.[0]?.value ?? "",
      activeUsers: row.metricValues?.[0]?.value ?? "",
      screenPageViews: row.metricValues?.[1]?.value ?? "",
    }));
  } catch (error) {
    console.error("Failed to fetch GA view count", error);
    return [];
  }
}

export default function UsersPage({ loaderData }: Route.ComponentProps) {
  const [period, setPeriod] = useQueryState(
    "period",
    parseAsInteger.withDefault(30),
  );
  const daysAgo = DateTime.now()
    .minus({ days: period ?? 30 })
    .toJSDate();
  const recent = loaderData.users.filter(
    ({ createdAt, isAdmin }) =>
      createdAt.getTime() > daysAgo.getTime() && !isAdmin,
  );
  const analytics = loaderData.analytics.filter(
    ({ date }) => DateTime.fromFormat(date, "yyyyMMdd").toJSDate() > daysAgo,
  );

  return (
    <main className="flex flex-col gap-8">
      <RangeSelector period={period} setPeriod={setPeriod} />
      <Analytics analytics={analytics} users={recent} />
      <AllUsers users={recent} />
      <WaitingList waiting={loaderData.waiting} />
    </main>
  );
}

function RangeSelector({
  period,
  setPeriod,
}: {
  period: number;
  setPeriod: (period: number) => void;
}) {
  return (
    <Tabs className="mx-auto" value={period.toString()}>
      <TabsList>
        {[10, 30, 90].map((days) => (
          <TabsTrigger
            key={days}
            onClick={() => setPeriod(days)}
            value={days.toString()}
          >
            Last {days} Days
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

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
  const activeUsers = sumBy(analytics, (day) => Number(day.activeUsers));
  const signedUp = users.filter(({ passwordHash }) => passwordHash !== null);

  return (
    <div className="flex flex-col gap-8">
      {/* Tabs for period selection */}

      {/* Conversion Funnel */}
      <div className="mx-auto flex flex-row items-center gap-4">
        <Stat
          title="Page Views"
          value={sumBy(analytics, (day) =>
            Number(day.screenPageViews),
          ).toLocaleString()}
          description="Google Analytics"
        />
        <ArrowRight className="h-6 w-6 text-gray-400" />
        <Stat
          title="Active Users"
          value={activeUsers.toLocaleString()}
          description="From page views"
        />
        <ArrowRight className="h-6 w-6 text-gray-400" />
        <Stat
          title="Conversations"
          value={users.length.toLocaleString()}
          description={`${((users.length / activeUsers) * 100).toFixed(2)}% of active`}
        />
        <ArrowRight className="h-6 w-6 text-gray-400" />
        <Stat
          title="Signed Up"
          value={signedUp.length.toLocaleString()}
          description={`${((signedUp.length / users.length) * 100).toFixed(2)}% of chats`}
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
        accessorKey: "name",
        cell: ({ row }) => (
          <Link
            to={`/admin/user/${row.original.id}`}
            className="truncate text-blue-500 underline hover:decoration-[hsl(37,92%,65%)]"
          >
            {" "}
            {row.original.name || row.original.id}{" "}
          </Link>
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
        size: 350,
        header: "Source",
      },
      {
        accessorKey: "ip",
        header: "IP",
        size: 100,
        sortingFn: "alphanumeric",
      },
      {
        accessorFn: (row) =>
          DateTime.fromJSDate(row.createdAt)
            .setZone((row.geocode as { timeZone: string }).timeZone ?? "UTC")
            .toFormat("yyyy-MM-dd HH:mm"),
        accessorKey: "createdAt",
        header: "Created",
        size: 130,
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
            <Fragment key={row.id}>
              <TableRow>
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
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </section>
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
    <section className="flex flex-col gap-4">
      <h2 className="font-bold text-2xl">
        Waiting List{" "}
        <span className="text-gray-500">({waiting.length} waiting)</span>
      </h2>

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
    </section>
  );
}

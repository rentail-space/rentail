import { BetaAnalyticsDataClient } from "@google-analytics/data";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { timeAgo } from "date-buddy";
import { groupBy, invariant, sumBy } from "es-toolkit";
import { JWT } from "google-auth-library";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  MoveLeft,
  MoveRight,
} from "lucide-react";
import { DateTime } from "luxon";
import { useQueryState } from "nuqs";
import type { User } from "prisma/generated/client";
import { Link, type LoaderFunctionArgs } from "react-router";
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
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/Tabs";
import deviceDetection from "~/lib/deviceDetection";
import envVars from "~/lib/env";
import prisma from "~/lib/prisma";
import { verifyAdmin } from "~/lib/sessions.server";
import { cleanParseWorkingMemory } from "~/lib/workingMemory";
import type { Route } from "./+types/admin.users";

export async function loader({ request }: LoaderFunctionArgs) {
  await verifyAdmin(request.headers);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    where: { isBot: false },
  });

  const waiting = await prisma.waitlist.findMany();
  const analytics = await fromGoogleAnalytics();
  return { users, waiting, analytics };
}

async function fromGoogleAnalytics(): Promise<
  Array<{
    activeUsers: number;
    averageSessionDuration: number;
    date: string;
    sessionSource: string;
  }>
> {
  const auth = new JWT({
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    email: "analytics@rentail-480516.iam.gserviceaccount.com",
    key: envVars.GOOGLE_ANALYTICS_PRIVATE_KEY,
  });
  const client = new BetaAnalyticsDataClient({ authClient: auth });

  try {
    // https://support.google.com/analytics/table/13948007
    const response = await client.runReport({
      dateRanges: [{ endDate: "today", startDate: "90daysAgo" }],
      dimensions: [{ name: "date" }, { name: "sessionSource" }],
      metrics: [
        // The number of distinct users who visited your website or application.
        { name: "activeUsers" },
        // The average duration of user sessions, in seconds.
        { name: "averageSessionDuration" },
      ],
      property: "properties/496833933",
    });
    const rows = response[0].rows;
    invariant(rows, "No rows found");

    return rows.map((row) => ({
      date: row.dimensionValues?.[0]?.value ?? "",
      sessionSource: row.dimensionValues?.[1]?.value ?? "",
      activeUsers: Number.parseInt(row.metricValues?.[0]?.value ?? "", 10),
      averageSessionDuration: Number.parseFloat(
        row.metricValues?.[1]?.value ?? "",
      ),
    }));
  } catch (error) {
    console.error("Failed to fetch GA view count", error);
    return [];
  }
}

export default function UsersPage({ loaderData }: Route.ComponentProps) {
  const today = DateTime.now();
  const [from, setFrom] = useQueryState("from", {
    defaultValue: today.minus({ days: 30 }).toFormat("yyyy-MM-dd"),
    history: "replace",
  });
  const [until, setUntil] = useQueryState("until", {
    defaultValue: today.toFormat("yyyy-MM-dd"),
    history: "replace",
  });

  const start = DateTime.fromFormat(from, "yyyy-MM-dd")
    .startOf("day")
    .toJSDate();
  const end = DateTime.fromFormat(until, "yyyy-MM-dd").endOf("day").toJSDate();
  const recentUsers = loaderData.users.filter(
    ({ createdAt, isAdmin }) =>
      createdAt >= start && createdAt <= end && !isAdmin,
  );
  const analytics = loaderData.analytics.filter(({ date }) => {
    const day = DateTime.fromFormat(date, "yyyyMMdd").startOf("day").toJSDate();
    return day >= start && day <= end;
  });

  return (
    <main className="flex flex-col gap-8">
      <RangeSelector
        from={from}
        setFrom={setFrom}
        until={until}
        setUntil={setUntil}
      />
      <Analytics analytics={analytics} users={recentUsers} />
      <AllUsers users={recentUsers} />
      <Sources analytics={analytics} />
    </main>
  );
}

function RangeSelector({
  from,
  setFrom,
  until,
  setUntil,
}: {
  from: string;
  setFrom: (from: string) => void;
  until: string;
  setUntil: (until: string) => void;
}) {
  const today = DateTime.now();
  const daysInPeriod =
    until === today.toFormat("yyyy-MM-dd") &&
    Math.floor(
      today.diff(DateTime.fromFormat(from, "yyyy-MM-dd"), "days").days,
    );

  return (
    <div className="flex flex-row items-center justify-between">
      <Tabs value={daysInPeriod.toString()}>
        <TabsList>
          {[10, 30, 90].map((daysInPeriod) => (
            <TabsTrigger
              key={daysInPeriod}
              onClick={() => {
                setFrom(
                  today.minus({ days: daysInPeriod }).toFormat("yyyy-MM-dd"),
                );
                setUntil(today.toFormat("yyyy-MM-dd"));
              }}
              value={daysInPeriod.toString()}
            >
              Last {daysInPeriod} Days
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-row items-center gap-0">
        <Input
          className="w-36"
          onChange={({ target }) => setFrom(target.value)}
          type="date"
          value={from}
        />
        <ArrowRight className="h-8 w-8 text-gray-500" />
        <Input
          className="w-36"
          onChange={({ target }) => setUntil(target.value)}
          type="date"
          value={until}
        />
      </div>

      <div className="flex flex-row items-center gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setFrom(
              DateTime.fromFormat(from, "yyyy-MM-dd")
                .minus({ days: 1 })
                .toFormat("yyyy-MM-dd"),
            );
            setUntil(
              DateTime.fromFormat(until, "yyyy-MM-dd")
                .minus({ days: 1 })
                .toFormat("yyyy-MM-dd"),
            );
          }}
        >
          <MoveLeft className="h-10 w-10 text-gray-500" />
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setFrom(
              DateTime.fromFormat(from, "yyyy-MM-dd")
                .plus({ days: 1 })
                .toFormat("yyyy-MM-dd"),
            );
            setUntil(
              DateTime.fromFormat(until, "yyyy-MM-dd")
                .plus({ days: 1 })
                .toFormat("yyyy-MM-dd"),
            );
          }}
        >
          <MoveRight className="h-10 w-10 text-gray-500" />
        </Button>
      </div>
    </div>
  );
}

function Analytics({
  analytics,
  users,
}: {
  analytics: Awaited<ReturnType<typeof fromGoogleAnalytics>>;
  users: User[];
}) {
  const activeUsers = sumBy(analytics, (day) => Number(day.activeUsers));

  return (
    <div className="flex flex-col gap-8">
      <div className="mx-auto flex flex-row items-center gap-4">
        <Stat
          title="Active Users"
          value={activeUsers.toLocaleString()}
          description="From page views"
        />
        <Stat
          title="From LLM"
          value={sumBy(
            analytics.filter(
              (entry) =>
                entry.sessionSource === "chatgpt.com" ||
                entry.sessionSource === "perplexity.ai",
            ),
            (entry) => entry.activeUsers,
          ).toLocaleString()}
          description="ChatGPT/Perplexity"
        />
        <Stat
          title="Chats"
          value={users.length.toLocaleString()}
          description={`${((users.length / activeUsers) * 100).toFixed(2)}% of active`}
        />
        <Stat
          title="Session Duration"
          value={`${(
            sumBy(analytics, (entry) => entry.averageSessionDuration) /
              analytics.length
          ).toFixed(0)} sec`}
          description="Seconds"
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
        cell: ({ row }) => (
          <span className="flex flex-row items-center justify-between gap-2">
            <span className="w-48">
              {DateTime.fromJSDate(row.original.createdAt)
                .setZone(
                  cleanParseWorkingMemory(row.original.workingMemory).location
                    ?.timeZone ?? "UTC",
                )
                .toFormat("yyyy-MM-dd HH:mm")}
            </span>
            <span className="w-24">{timeAgo(row.original.createdAt)}</span>
          </span>
        ),
        header: "Created",
        size: 220,
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

function Sources({
  analytics,
}: {
  analytics: Awaited<ReturnType<typeof fromGoogleAnalytics>>;
}) {
  const grouped = groupBy(analytics, (entry) => entry.sessionSource);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-bold text-2xl">
        Sources{" "}
        <span className="text-gray-500">
          ({sumBy(Object.values(analytics), (entry) => entry.activeUsers)} users
          / {Object.keys(grouped).length} sources)
        </span>
      </h2>
      <Table>
        <TableBody>
          {Object.entries(grouped).map(([sessionSource, entries], index) => (
            <TableRow key={sessionSource} className="hover:bg-gray-100">
              <TableHead className="w-10">{index + 1}</TableHead>
              <TableCell>{sessionSource}</TableCell>
              <TableCell className="text-right">
                {sumBy(entries, (entry) => entry.activeUsers).toLocaleString()}{" "}
                users
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

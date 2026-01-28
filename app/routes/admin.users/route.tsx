import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { invariant } from "es-toolkit";
import { JWT } from "google-auth-library";
import { DateTime } from "luxon";
import { startTransition } from "react";
import { type LoaderFunctionArgs, useSearchParams } from "react-router";
import envVars from "~/lib/env";
import prisma from "~/lib/prisma.server";
import { verifyAdmin } from "~/lib/sessions.server";
import type { Route } from "./+types/route";
import AnalyticsCharts from "./AnalyticsCharts";
import AnalyticsSummary from "./AnalyticsSummary";
import Heatmap from "./Heatmap";
import RangeSelection from "./RangeSelection";
import RecentUsers from "./RecentUsers";
import UserSources from "./UserSources";

export type Analytics = {
  averageSessionDuration: number;
  date: string;
  hour: number;
  sessionSource: string;
  visitors: number;
};

export async function loader({ request }: LoaderFunctionArgs) {
  await verifyAdmin(request.headers);

  const searchParams = new URL(request.url).searchParams;
  const { from, until } = parseDates(searchParams);
  const users = prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    where: {
      isBot: false,
      isAdmin: false,
      createdAt: { gte: from.toJSDate(), lte: until.toJSDate() },
    },
  });
  const analytics = fromGoogleAnalytics(from, until);
  return {
    analytics,
    users: Promise.resolve(users),
  };
}

function parseDates(searchParams: URLSearchParams): {
  from: DateTime;
  until: DateTime;
} {
  const fromValue = searchParams.get("from");
  const untilValue = searchParams.get("until");
  const from = fromValue
    ? DateTime.fromISO(fromValue, { zone: "utc" })
    : DateTime.utc().minus({ days: 30 });
  const until = untilValue
    ? DateTime.fromISO(untilValue, { zone: "utc" })
    : DateTime.utc().minus({ days: 1 });
  return { from, until };
}

async function fromGoogleAnalytics(
  from: DateTime,
  until: DateTime,
): Promise<Analytics[]> {
  const auth = new JWT({
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    email: "analytics@rentail-480516.iam.gserviceaccount.com",
    key: envVars.GOOGLE_ANALYTICS_PRIVATE_KEY,
  });
  const client = new BetaAnalyticsDataClient({ authClient: auth });

  // @see https://support.google.com/analytics/table/13948007
  const response = await client.runReport({
    dateRanges: [
      {
        startDate: from.toFormat("yyyy-MM-dd"),
        endDate: until.toFormat("yyyy-MM-dd"),
      },
    ],
    dimensions: [{ name: "date" }, { name: "hour" }, { name: "sessionSource" }],
    metrics: [
      // The number of distinct GA users -> unique visitors
      { name: "activeUsers" },
      // The average duration of user sessions, in seconds.
      { name: "averageSessionDuration" },
    ],
    property: "properties/496833933",
  });
  const rows = response[0].rows;
  invariant(rows, "No rows found");

  return rows.map((row) => ({
    averageSessionDuration: Number.parseFloat(
      row.metricValues?.[1]?.value ?? "",
    ),
    date: row.dimensionValues?.[0]?.value ?? "",
    hour: Number.parseInt(row.dimensionValues?.[1]?.value ?? "0", 10),
    sessionSource: row.dimensionValues?.[2]?.value ?? "",
    visitors: Number.parseInt(row.metricValues?.[0]?.value ?? "", 10),
  }));
}

export default function UsersPage({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { from, until } = parseDates(searchParams);
  const setRange = (from: DateTime, until: DateTime) => {
    startTransition(() => {
      setSearchParams(
        (params) => {
          params.set("from", from.toISODate() ?? "");
          params.set("until", until.toISODate() ?? "");
          return params;
        },
        { replace: true },
      );
    });
  };
  const { analytics, users } = loaderData;

  return (
    <section className="space-y-4">
      <RangeSelection from={from} setRange={setRange} until={until} />

      <AnalyticsCharts
        analytics={analytics}
        from={from}
        until={until}
        users={users}
      />
      <AnalyticsSummary analytics={analytics} users={users} />
      <RecentUsers users={users} />
      <Heatmap analytics={analytics} users={users} />
      <UserSources analytics={analytics} />
    </section>
  );
}

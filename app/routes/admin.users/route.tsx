import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { invariant } from "es-toolkit";
import { JWT } from "google-auth-library";
import { DateTime } from "luxon";
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
  const from = parseFrom(searchParams);
  const until = parseUntil(searchParams);
  const users = prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    where: {
      isBot: false,
      isAdmin: false,
      createdAt: { gte: from, lte: until },
    },
  });
  return {
    analytics: fromGoogleAnalytics(from, until),
    users: Promise.resolve(users),
  };
}

function parseFrom(searchParams: URLSearchParams): Date {
  const from = searchParams.get("from");
  if (!from) return DateTime.utc().minus({ days: 30 }).toJSDate();
  return DateTime.fromISO(from, { zone: "utc" }).toJSDate();
}

function parseUntil(searchParams: URLSearchParams): Date {
  const until = searchParams.get("until");
  if (!until) return DateTime.utc().minus({ days: 1 }).toJSDate();
  return DateTime.fromISO(until, { zone: "utc" }).toJSDate();
}

async function fromGoogleAnalytics(
  from: Date,
  until: Date,
): Promise<Analytics[]> {
  const auth = new JWT({
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    email: "analytics@rentail-480516.iam.gserviceaccount.com",
    key: envVars.GOOGLE_ANALYTICS_PRIVATE_KEY,
  });
  const client = new BetaAnalyticsDataClient({ authClient: auth });

  try {
    // @see https://support.google.com/analytics/table/13948007
    const response = await client.runReport({
      dateRanges: [
        {
          startDate: DateTime.fromJSDate(from).toFormat("yyyy-MM-dd"),
          endDate: DateTime.fromJSDate(until).toFormat("yyyy-MM-dd"),
        },
      ],
      dimensions: [
        { name: "date" },
        { name: "hour" },
        { name: "sessionSource" },
      ],
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
  } catch (error) {
    console.error("Failed to fetch GA view count", error);
    return [];
  }
}

export default function UsersPage({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const from = parseFrom(searchParams);
  const setFrom = (value: Date) => {
    setSearchParams(
      (params) => {
        params.set("from", value.toISOString().split("T")[0]);
        return params;
      },
      { replace: true },
    );
  };
  const until = parseUntil(searchParams);
  const setUntil = (value: Date) => {
    setSearchParams(
      (params) => {
        params.set("until", value.toISOString().split("T")[0]);
        return params;
      },
      { replace: true },
    );
  };

  return (
    <section className="space-y-4">
      <RangeSelection
        from={from}
        setFrom={setFrom}
        setUntil={setUntil}
        until={until}
      />

      <AnalyticsCharts
        analytics={loaderData.analytics}
        from={from}
        until={until}
        users={loaderData.users}
      />
      <AnalyticsSummary
        analytics={loaderData.analytics}
        users={loaderData.users}
      />
      <RecentUsers users={loaderData.users} />
      <Heatmap analytics={loaderData.analytics} users={loaderData.users} />

      <UserSources analytics={loaderData.analytics} />
    </section>
  );
}

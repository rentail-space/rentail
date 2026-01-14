import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { invariant } from "es-toolkit";
import { JWT } from "google-auth-library";
import type { LoaderFunctionArgs } from "react-router";
import envVars from "~/lib/env";
import prisma from "~/lib/prisma";
import { verifyAdmin } from "~/lib/sessions.server";
import type { Route } from "./+types/route";
import AnalyticsCharts from "./AnalyticsCharts";
import AnalyticsSummary from "./AnalyticsSummary";
import Heatmap from "./Heatmap";
import RangeSelection from "./RangeSelection";
import RecentUsers from "./RecentUsers";

export async function loader({ request }: LoaderFunctionArgs) {
  await verifyAdmin(request.headers);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    where: { isBot: false },
  });

  const analytics = await fromGoogleAnalytics();
  return { users, analytics };
}

async function fromGoogleAnalytics(): Promise<
  Array<{
    averageSessionDuration: number;
    date: string;
    hour: number;
    sessionSource: string;
    visitors: number;
  }>
> {
  const auth = new JWT({
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    email: "analytics@rentail-480516.iam.gserviceaccount.com",
    key: envVars.GOOGLE_ANALYTICS_PRIVATE_KEY,
  });
  const client = new BetaAnalyticsDataClient({ authClient: auth });

  try {
    // @see https://support.google.com/analytics/table/13948007
    const response = await client.runReport({
      dateRanges: [{ endDate: "today", startDate: "90daysAgo" }],
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
  return (
    <section className="flex flex-col gap-8">
      <RangeSelection analytics={loaderData.analytics} users={loaderData.users}>
        {({ range, recentUsers, analytics, selectorUI }) => (
          <>
            <AnalyticsCharts
              analytics={analytics}
              range={range}
              users={recentUsers}
            />
            {selectorUI()}
            <AnalyticsSummary analytics={analytics} users={recentUsers} />
            <RecentUsers users={recentUsers} />
            <Heatmap analytics={analytics} users={recentUsers} />
          </>
        )}
      </RangeSelection>
    </section>
  );
}

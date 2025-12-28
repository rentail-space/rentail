import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { invariant } from "es-toolkit";
import { JWT } from "google-auth-library";
import type { LoaderFunctionArgs } from "react-router";
import envVars from "~/lib/env";
import prisma from "~/lib/prisma";
import { verifyAdmin } from "~/lib/sessions.server";
import type { Route } from "./+types/route";
import Charts from "./AnalyticsCharts";
import AnalyticsSummary from "./AnalyticsSummary";
import RangeSelection from "./RangeSelection";
import RecentUsers from "./RecentUsers";
import UserSources from "./UserSources";

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
  return (
    <main className="flex flex-col gap-8">
      <RangeSelection analytics={loaderData.analytics} users={loaderData.users}>
        {({ recentUsers, analytics, selectorUI }) => (
          <>
            <Charts analytics={analytics} users={recentUsers} />
            {selectorUI()}
            <AnalyticsSummary analytics={analytics} users={recentUsers} />
            <RecentUsers users={recentUsers} />
            <UserSources analytics={analytics} />
          </>
        )}
      </RangeSelection>
    </main>
  );
}

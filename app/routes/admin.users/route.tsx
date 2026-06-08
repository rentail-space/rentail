import { BetaAnalyticsDataClient } from "@google-analytics/data";
import type { Temporal } from "@js-temporal/polyfill";
import { groupBy, meanBy, sumBy } from "es-toolkit";
import { JWT } from "google-auth-library";
import type { LoaderFunctionArgs } from "react-router";
import invariant from "tiny-invariant";
import envVars from "~/lib/env";
import prisma from "~/lib/prisma.server";
import { verifyAdmin } from "~/lib/sessions.server";
import DateRangeSelector, {
  parseDateRange,
  useRangeSelection,
} from "../../components/ui/DateRangeSelector";
import type { Route } from "./+types/route";
import AnalyticsCharts from "./AnalyticsCharts";
import AnalyticsSummary from "./AnalyticsSummary";
import RecentUsers from "./RecentUsers";
import UserSources from "./UserSources";

export type Analytics = {
  averageSessionDuration: number;
  date: string;
  sessionSource: string;
  visitors: number;
};

export async function loader({ request }: LoaderFunctionArgs) {
  await verifyAdmin(request.headers);

  const searchParams = new URL(request.url).searchParams;
  const { from, until } = parseDateRange(searchParams);
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    where: {
      isBot: false,
      isAdmin: false,
      createdAt: {
        gte: new Date(from.toString()),
        lte: new Date(until.toString()),
      },
    },
  });
  const analytics = fromGoogleAnalytics(from, until);
  return { analytics, users };
}

async function fromGoogleAnalytics(
  from: Temporal.PlainDate,
  until: Temporal.PlainDate,
): Promise<Analytics[]> {
  const authClient = new JWT({
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    email: "analytics@rentail-480516.iam.gserviceaccount.com",
    key: envVars.GOOGLE_ANALYTICS_PRIVATE_KEY,
  });
  const client = new BetaAnalyticsDataClient({
    authClient: authClient as never,
  });

  // @see https://support.google.com/analytics/table/13948007
  const response = await client.runReport({
    dateRanges: [
      {
        startDate: from.toString(),
        endDate: until.toString(),
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

  const analytics = rows.map((row) => ({
    averageSessionDuration: Number.parseFloat(
      row.metricValues?.[1]?.value ?? "",
    ),
    date: row.dimensionValues?.[0]?.value ?? "",
    hour: Number.parseInt(row.dimensionValues?.[1]?.value ?? "0", 10),
    sessionSource: row.dimensionValues?.[2]?.value ?? "",
    visitors: Number.parseInt(row.metricValues?.[0]?.value ?? "", 10),
  }));
  return Object.entries(
    groupBy(analytics, ({ date, sessionSource }) => `${date}-${sessionSource}`),
  ).map(([, entries]) => ({
    date: entries[0].date,
    averageSessionDuration: meanBy(
      entries,
      ({ averageSessionDuration }) => averageSessionDuration,
    ),
    visitors: sumBy(entries, ({ visitors }) => visitors),
    sessionSource: entries[0].sessionSource,
  }));
}

export default function UsersPage({ loaderData }: Route.ComponentProps) {
  const { from, until } = useRangeSelection();
  const { analytics, users } = loaderData;

  return (
    <main className="space-y-4">
      <DateRangeSelector />

      <section className="space-y-4">
        <AnalyticsCharts
          analytics={analytics}
          from={from}
          until={until}
          users={users}
        />
        <AnalyticsSummary analytics={analytics} users={users} />
        <RecentUsers users={users} />
        <UserSources analytics={analytics} />
      </section>
    </main>
  );
}

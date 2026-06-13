import { Temporal } from "@js-temporal/polyfill";
import { groupBy, meanBy, sumBy } from "es-toolkit";
import type { LoaderFunctionArgs } from "react-router";
import prisma from "~/lib/prisma.server";
import { verifyAdmin } from "~/lib/sessions.server";
import DateRangeSelector, {
  parseDateRange,
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

/**
 * Don't re-run the loader when only search params change (tab clicks).
 * The loader data is already loaded and the component uses URL search
 * params client-side to drive the display.
 */
export function shouldRevalidate({
  defaultShouldRevalidate,
  currentUrl,
  nextUrl,
}: {
  currentUrl: URL;
  nextUrl: URL;
  defaultShouldRevalidate: boolean;
}) {
  if (currentUrl.pathname !== nextUrl.pathname) return defaultShouldRevalidate;
  return false;
}

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
  const analytics = await fromGoogleAnalytics(from, until).catch(() => []);
  return { analytics, users };
}

async function fromGoogleAnalytics(
  from: Temporal.PlainDate,
  until: Temporal.PlainDate,
): Promise<Analytics[]> {
  const [{ createGoogleAnalyticsAuth }, { BetaAnalyticsDataClient }] =
    await Promise.all([
      import("~/lib/googleAnalytics.server"),
      import("~/lib/googleAnalyticsData.server"),
    ]);

  const authClient = createGoogleAnalyticsAuth(
    "https://www.googleapis.com/auth/analytics.readonly",
  );
  const client = new BetaAnalyticsDataClient({
    authClient: authClient as never,
  });

  try {
    const response = await client.runReport({
      dateRanges: [
        {
          startDate: from.toString(),
          endDate: until.toString(),
        },
      ],
      dimensions: [
        { name: "date" },
        { name: "hour" },
        { name: "sessionSource" },
      ],
      metrics: [{ name: "activeUsers" }, { name: "averageSessionDuration" }],
      property: "properties/496833933",
    });
    const rows = response[0].rows;
    if (!rows) return [];

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
      groupBy(
        analytics,
        ({ date, sessionSource }) => `${date}-${sessionSource}`,
      ),
    ).map(([, entries]) => ({
      date: entries[0].date,
      averageSessionDuration: meanBy(
        entries,
        ({ averageSessionDuration }) => averageSessionDuration,
      ),
      visitors: sumBy(entries, ({ visitors }) => visitors),
      sessionSource: entries[0].sessionSource,
    }));
  } catch (error) {
    console.error("Failed to fetch Google Analytics data:", error);
    return [];
  }
}

export default function UsersPage({ loaderData }: Route.ComponentProps) {
  const { analytics, users } = loaderData;

  // Detect which period the data was loaded for from the URL
  const initialPeriod = parseDateRange(
    new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : "",
    ),
  ).period;
  const today = Temporal.Now.plainDateISO("UTC");

  return (
    <main className="space-y-4">
      <DateRangeSelector
        period={initialPeriod}
        onPeriodChange={(period) => {
          const from = today.subtract({ days: period });
          window.location.href = `?from=${from.toString()}&until=${today.toString()}`;
        }}
      />

      <section className="space-y-4">
        <AnalyticsCharts
          analytics={analytics}
          from={today.subtract({ days: initialPeriod })}
          until={today}
          users={users}
        />
        <AnalyticsSummary analytics={analytics} users={users} />
        <RecentUsers users={users} />
        <UserSources analytics={analytics} />
      </section>
    </main>
  );
}

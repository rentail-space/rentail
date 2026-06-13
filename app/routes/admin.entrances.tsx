import { Temporal } from "@js-temporal/polyfill";
import { sumBy } from "es-toolkit";
import type { LoaderFunctionArgs } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import DateRangeSelector, {
  parseDateRange,
} from "~/components/ui/DateRangeSelector";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/Table";
import { verifyAdmin } from "~/lib/sessions.server";
import type { Route } from "./+types/admin.entrances";

/**
 * Don't re-run the loader when only search params change (tab clicks).
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
  const { period } = parseDateRange(new URL(request.url).searchParams);
  return await getEntrances(period);
}

async function getEntrances(period: number) {
  const endDate = Temporal.Now.zonedDateTimeISO("UTC");
  const startDate = endDate.subtract({ days: period });

  const [{ createGoogleAnalyticsAuth }, { BetaAnalyticsDataClient }] =
    await Promise.all([
      import("~/lib/googleAnalytics.server"),
      import("~/lib/googleAnalyticsData.server"),
    ]);

  const authClient = createGoogleAnalyticsAuth(
    "https://www.googleapis.com/auth/analytics.readonly",
  );

  const analyticsDataClient = new BetaAnalyticsDataClient({
    authClient: authClient as never,
  });
  try {
    const [entrancesResponse] = await Promise.race([
      analyticsDataClient.runReport({
        property: "properties/496833933",
        dateRanges: [
          {
            startDate: startDate.toPlainDate().toString(),
            endDate: endDate.toPlainDate().toString(),
          },
        ],
        dimensions: [{ name: "landingPage" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 50,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Google Analytics request timed out")),
          10_000,
        ),
      ),
    ]);
    if (!entrancesResponse.rows) return [];
    return entrancesResponse.rows.map((row) => ({
      path: row.dimensionValues?.[0]?.value || "",
      views: Number(row.metricValues?.[0]?.value) || 0,
    }));
  } catch (error) {
    console.error("Failed to fetch Google Analytics entrances:", error);
    return [];
  }
}

export default function AdminPages({ loaderData }: Route.ComponentProps) {
  return (
    <Card className="bg-secondary-background text-foreground">
      <CardHeader className="flex items-center justify-between gap-2">
        <CardTitle className="text-center font-bold text-2xl">
          Landing Pages (Entrances) Traffic
        </CardTitle>
        <DateRangeSelector />
      </CardHeader>
      <CardContent>
        <EntrancesTable entrances={loaderData} />
      </CardContent>
    </Card>
  );
}

function EntrancesTable({
  entrances,
}: {
  entrances: { path: string; views: number }[];
}) {
  const totalEntrances = sumBy(entrances ?? [], (entrance) => entrance.views);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Page</TableHead>
          <TableHead className="text-right">Sessions</TableHead>
          <TableHead className="text-right">%</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entrances?.map((entrance) => (
          <TableRow key={entrance.path} className="hover:bg-gray-50">
            <TableCell>{entrance.path}</TableCell>
            <TableCell className="text-right">
              {entrance.views.toLocaleString()}
            </TableCell>
            <TableCell className="text-right">
              {((entrance.views / totalEntrances) * 100).toFixed(1)}%
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

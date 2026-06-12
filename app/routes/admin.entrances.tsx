import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { Temporal } from "@js-temporal/polyfill";
import { sumBy } from "es-toolkit";
import { Suspense } from "react";
import { Await, type LoaderFunctionArgs } from "react-router";
import invariant from "tiny-invariant";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import DateRangeSelector, {
  parseDateRange,
} from "~/components/ui/DateRangeSelector";
import LoadingProgress from "~/components/ui/LoadingProgress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/Table";
import { createGoogleAnalyticsAuth } from "~/lib/googleAnalytics.server";
import { verifyAdmin } from "~/lib/sessions.server";
import type { Route } from "./+types/admin.entrances";

export async function loader({ request }: LoaderFunctionArgs) {
  await verifyAdmin(request.headers);
  const { period } = parseDateRange(new URL(request.url).searchParams);
  return getEntrances(period);
}

async function getEntrances(period: number) {
  const endDate = Temporal.Now.zonedDateTimeISO("UTC");
  const startDate = endDate.subtract({ days: period });

  const authClient = createGoogleAnalyticsAuth(
    "https://www.googleapis.com/auth/analytics.readonly",
  );

  const analyticsDataClient = new BetaAnalyticsDataClient({
    authClient: authClient as never,
  });
  const [entrancesResponse] = await analyticsDataClient.runReport({
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
  });
  invariant(entrancesResponse.rows, "No rows found");
  return entrancesResponse.rows.map((row) => ({
    path: row.dimensionValues?.[0]?.value || "",
    views: Number(row.metricValues?.[0]?.value) || 0,
  }));
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
        <Suspense fallback={<LoadingProgress />}>
          <Await resolve={loaderData}>
            {(entrances) => <EntrancesTable entrances={entrances} />}
          </Await>
        </Suspense>
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

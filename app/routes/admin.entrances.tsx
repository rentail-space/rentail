import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { invariant, sumBy } from "es-toolkit";
import { JWT } from "google-auth-library";
import { DateTime } from "luxon";
import { Suspense } from "react";
import { Await, type LoaderFunctionArgs } from "react-router";
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
import envVars from "~/lib/env";
import { verifyAdmin } from "~/lib/sessions.server";
import type { Route } from "./+types/admin.entrances";

export async function loader({ request }: LoaderFunctionArgs) {
  await verifyAdmin(request.headers);
  const { period } = parseDateRange(new URL(request.url).searchParams);
  return getEntrances(period);
}

async function getEntrances(period: number) {
  const endDate = DateTime.utc();
  const startDate = endDate.minus({ days: period });

  const authClient = new JWT({
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    email: "analytics@rentail-480516.iam.gserviceaccount.com",
    key: envVars.GOOGLE_ANALYTICS_PRIVATE_KEY,
  });
  const analyticsDataClient = new BetaAnalyticsDataClient({ authClient });
  const [entrancesResponse] = await analyticsDataClient.runReport({
    property: "properties/496833933",
    dateRanges: [
      {
        startDate: startDate.toFormat("yyyy-MM-dd"),
        endDate: endDate.toFormat("yyyy-MM-dd"),
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
        <CardTitle className="text-center font-bold text-2xl">Landing Pages (Entrances) Traffic
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

import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { sumBy } from "es-toolkit";
import { JWT } from "google-auth-library";
import { DateTime } from "luxon";
import { Suspense } from "react";
import { Await, type LoaderFunctionArgs, useSearchParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import LoadingProgress from "~/components/ui/LoadingProgress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/Table";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/Tabs";
import envVars from "~/lib/env";
import { verifyAdmin } from "~/lib/sessions.server";
import type { Route } from "./+types/admin.pages";

export async function loader({ request }: LoaderFunctionArgs) {
  await verifyAdmin(request.headers);

  const authClient = new JWT({
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    email: "analytics@rentail-480516.iam.gserviceaccount.com",
    key: envVars.GOOGLE_ANALYTICS_PRIVATE_KEY,
  });
  const analyticsDataClient = new BetaAnalyticsDataClient({ authClient });
  const period = Number(new URL(request.url).searchParams.get("period")) || 30;

  return getEntrances({
    analyticsDataClient,
    propertyId: "properties/496833933",
    period,
  });
}

async function getEntrances({
  analyticsDataClient,
  propertyId,
  period,
}: {
  analyticsDataClient: BetaAnalyticsDataClient;
  propertyId: string;
  period: number;
}) {
  const endDate = DateTime.utc();
  const startDate = endDate.minus({ days: period });
  const [entrancesResponse] = await analyticsDataClient.runReport({
    property: propertyId,
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
  return entrancesResponse.rows?.map((row) => ({
    path: row.dimensionValues?.[0]?.value || "",
    views: Number(row.metricValues?.[0]?.value) || 0,
  }));
}

const periods = [30, 60, 90];

export default function AdminPages({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams({
    period: periods[0].toString(),
  });
  const period = Number(searchParams.get("period"));

  return (
    <Card className="bg-secondary-background text-foreground">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>Landing Pages (Entrances)</span>

          <Tabs
            onValueChange={(value) => {
              setSearchParams(
                (params) => {
                  params.set("period", value);
                  return params;
                },
                { replace: true },
              );
            }}
            value={period}
          >
            <TabsList>
              {periods.map((d) => (
                <TabsTrigger key={d} value={d}>
                  Last {d} Days
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<LoadingProgress />}>
          <Await resolve={loaderData}>
            {(entrances) => <EntrancesTable entrances={entrances ?? []} />}
          </Await>
        </Suspense>
      </CardContent>
    </Card>
  );
}

function EntrancesTable({
  entrances,
}: {
  entrances: { path: string; views: number; percentage: number }[];
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

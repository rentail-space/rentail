import { groupBy, meanBy, orderBy, sumBy } from "es-toolkit";
import { DateTime } from "luxon";
import { Fragment, Suspense } from "react";
import { Await } from "react-router";
import LoadingProgress from "~/components/ui/LoadingProgress";
import prisma from "~/lib/prisma";
import { verifyAdmin } from "~/lib/sessions.server";
import type { Route } from "./+types/route";
import RecentVisibility from "./RecentVisibility";
import VisibilityCharts from "./VisibilityCharts";

export async function loader({ request }: Route.LoaderArgs) {
  await verifyAdmin(request.headers);

  return await prisma.visibilityCheck.findMany({
    orderBy: { createdAt: "desc" },
    where: {
      createdAt: { gte: DateTime.now().minus({ days: 90 }).toJSDate() },
    },
  });
}

export default function VisibilityPage({ loaderData }: Route.ComponentProps) {
  return (
    <section className="flex flex-col gap-8">
      <Suspense fallback={<LoadingProgress />}>
        <Await resolve={loaderData}>
          {(visibility) => {
            const groupedByDate = Object.entries(
              groupBy(visibility, ({ createdAt }) => createdAt.toISOString()),
            ).map(([date, queries]) => ({
              date,
              queries: queries.map((query) => ({
                category: query.category,
                citations: query.citations,
                query: query.query,
                ratio: citationRatio(query.citations),
                rentail: query.citations.filter(isRentail).length,
                score: scoreCitations(query.citations),
              })),
            }));
            const mostRecentQueries = orderBy(
              Object.entries(groupedByDate),
              [([date]) => date],
              ["asc"],
            )[0][1].queries;

            // Group by day so we have score, ratio, etc calculated from all
            // queries for that day
            const dailyTotals = groupedByDate.map(({ date, queries }) => {
              return {
                date,
                rentail: sumBy(queries, (query) => query.rentail),
                score: sumBy(queries, (query) => query.score),
                ratio: sumBy(queries, (query) => query.ratio),
              };
            });

            // Group by week so we have average score, ratio, etc for that week.
            const metrics = Object.entries(
              groupBy(dailyTotals, ({ date }) =>
                DateTime.fromISO(date).startOf("day").toFormat("yyyy-MM-dd"),
              ),
            )
              .map(([date, metrics]) => ({
                date,
                rentail: meanBy(metrics, (metric) => metric.rentail),
                score: meanBy(metrics, (metric) => metric.score),
                ratio: meanBy(metrics, (metric) => metric.ratio),
              }))
              .sort((a, b) =>
                DateTime.fromISO(a.date)
                  .diff(DateTime.fromISO(b.date))
                  .toMillis(),
              );

            return (
              <Fragment>
                <RecentVisibility queries={mostRecentQueries} />
                <VisibilityCharts metrics={metrics} />
              </Fragment>
            );
          }}
        </Await>
      </Suspense>
    </section>
  );
}

function citationRatio(citations: string[]): number {
  return citations.length > 0
    ? citations.filter(isRentail).length / citations.length
    : 0;
}

function scoreCitations(citations: string[]): number {
  const isFirstPlace = citations.length > 0 && isRentail(citations[0]);
  return (isFirstPlace ? 50 : 0) + citations.filter(isRentail).length * 10;
}

function isRentail(citation: string): boolean {
  return new URL(citation).hostname === "rentail.space";
}

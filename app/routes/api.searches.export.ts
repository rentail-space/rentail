import type { ActionFunctionArgs } from "react-router";
import type { SearchQuery } from "~/lib/googleSearchConsole";
import { verifyAdmin } from "~/lib/sessions.server";
import { stringify } from "csv-stringify/sync";
import { Temporal } from "@js-temporal/polyfill";
import { daysAgo } from "~/lib/temporal";
import invariant from "tiny-invariant";
import prisma from "~/lib/prisma.server";

export async function loader({ request }: ActionFunctionArgs) {
  await verifyAdmin(request.headers);

  const searchParams = new URL(request.url).searchParams;
  const daysParam = searchParams.get("days");
  const days = Number.parseInt(daysParam?.toString() ?? "30", 10);

  const validDays = days === 60 || days === 90 ? days : 30;
  const startDate = Temporal.Now.zonedDateTimeISO("UTC").subtract({
    days: validDays,
  });
  const key = `search-console:${validDays}:${startDate.toPlainDate().toString()}`;
  const from10DaysAgo = daysAgo(10);
  const cached = await prisma.cache.findUnique({
    where: { key, createdAt: { gte: from10DaysAgo } },
  });
  invariant(cached, "Cached query not found");
  const queries =
    typeof cached.value === "string"
      ? (JSON.parse(cached.value) as SearchQuery[])
      : (cached.value as unknown as SearchQuery[]);

  const csv = stringify(
    queries
      .sort((a, b) => b.impressions - a.impressions)
      .map((query) => ({
        Query: query.query,
        Impressions: query.impressions,
        Clicks: query.clicks,
        CTR: (query.ctr * 100).toFixed(2),
        Position: query.position.toFixed(1),
      })),
    {
      header: true,
      columns: ["Query", "Impressions", "Clicks", "CTR", "Position"],
    },
  );

  const date = Temporal.Now.zonedDateTimeISO("UTC").toPlainDate().toString();
  const filename = `search-queries-${date}+${validDays}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

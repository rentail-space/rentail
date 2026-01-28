import { DateTime } from "luxon";
import prisma from "~/lib/prisma.server";
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
    <section className="space-y-4">
      <h1 className="text-center font-bold text-2xl">
        Recent Visibility Checks
      </h1>

      <RecentVisibility visibility={loaderData} />
      <VisibilityCharts visibility={loaderData} />
    </section>
  );
}

import { useState } from "react";
import prisma from "~/lib/prisma.server";
import { daysAgo } from "~/lib/temporal";
import { verifyAdmin } from "~/lib/sessions.server";
import type { Route } from "./+types/route";
import RecentVisibility from "./RecentVisibility";
import VisibilityCharts from "./VisibilityCharts";

const PLATFORMS = ["chatgpt", "perplexity", "claude", "gemini"] as const;
type Platform = (typeof PLATFORMS)[number];

export async function loader({ request }: Route.LoaderArgs) {
  await verifyAdmin(request.headers);

  return await prisma.visibilityRun.findMany({
    include: { checks: true },
    orderBy: { createdAt: "desc" },
    where: {
      createdAt: { gte: daysAgo(90) },
    },
  });
}

export default function VisibilityPage({ loaderData }: Route.ComponentProps) {
  const [platform, setPlatform] = useState<Platform>("chatgpt");
  const runs = loaderData.filter((r) => r.platform === platform);

  return (
    <section className="space-y-4">
      <h1 className="text-center font-bold text-2xl">
        Recent Visibility Checks
      </h1>
      <div className="flex justify-center gap-2">
        {PLATFORMS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPlatform(p)}
            className={`rounded px-3 py-1 text-sm capitalize ${
              platform === p
                ? "bg-primary font-bold text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <RecentVisibility runs={runs} />
      <VisibilityCharts runs={runs} />
    </section>
  );
}

import prisma from "~/lib/prisma.server";
import { daysAgo } from "~/lib/temporal";
import { verifyAdmin } from "~/lib/sessions.server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/Tabs";
import type { Route } from "./+types/route";
import RecentVisibility from "./RecentVisibility";
import VisibilityCharts from "./VisibilityCharts";

const PLATFORMS = ["chatgpt", "perplexity", "claude", "gemini"] as const;

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
  return (
    <section className="space-y-4">
      <h1 className="text-center font-bold text-2xl">
        Recent Visibility Checks
      </h1>
      <Tabs defaultValue="chatgpt">
        <div className="flex justify-center">
          <TabsList>
            {PLATFORMS.map((p) => (
              <TabsTrigger key={p} value={p} className="capitalize">
                {p}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {PLATFORMS.map((p) => {
          const runs = loaderData.filter((r) => r.platform === p);
          return (
            <TabsContent key={p} value={p} className="space-y-4">
              <RecentVisibility runs={runs} />
              <VisibilityCharts runs={runs} />
            </TabsContent>
          );
        })}
      </Tabs>
    </section>
  );
}

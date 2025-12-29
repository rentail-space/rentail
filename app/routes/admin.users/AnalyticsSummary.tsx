import { meanBy, sumBy } from "es-toolkit";
import type { User } from "prisma/generated/client";
import type { loader } from "./route";

export default function AnalyticsSummary({
  analytics,
  users,
}: {
  analytics: Awaited<ReturnType<typeof loader>>["analytics"];
  users: User[];
}) {
  const visitors = sumBy(analytics, (day) => Number(day.visitors));
  const fromLLM = sumBy(
    analytics.filter(
      (entry) =>
        entry.sessionSource === "chatgpt.com" ||
        entry.sessionSource === "perplexity.ai",
    ),
    (entry) => entry.visitors,
  );
  const avgSessionDuration = meanBy(
    analytics,
    (entry) => entry.averageSessionDuration,
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="mx-auto flex flex-row items-center gap-4">
        <Stat
          title="Unique Visitors"
          value={visitors.toLocaleString()}
          description="From page views"
        />
        <Stat
          title="From LLM"
          value={`${fromLLM.toLocaleString()} (${formatPercentage(
            fromLLM / visitors,
          )})`}
          description="ChatGPT/Perplexity"
        />
        <Stat
          title="New Chats"
          value={`${users.length.toLocaleString()} (${formatPercentage(
            users.length / visitors,
          )})`}
          description="% of unique visitors"
        />
        <Stat
          title="Avg Session Duration"
          value={
            avgSessionDuration > 0
              ? `${Math.floor(avgSessionDuration / 60)}m ${Math.floor(
                  avgSessionDuration % 60,
                )
                  .toString()
                  .padStart(2, "0")}s`
              : "N/A"
          }
          description="Chat and all"
        />
      </div>
    </div>
  );
}

function formatPercentage(value: number): string {
  return value > 0 ? `${(value * 100).toFixed(2)}%` : "N/A";
}

function Stat({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="font-medium text-sm">{title}</div>
      <div className="font-bold text-2xl">{value}</div>
      <div className="text-gray-500 text-sm">{description}</div>
    </div>
  );
}

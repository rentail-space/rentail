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
          value={`${fromLLM.toLocaleString()} (${((fromLLM / visitors) * 100).toFixed(2)}%)`}
          description="ChatGPT/Perplexity"
        />
        <Stat
          title="New Chats"
          value={`${users.length.toLocaleString()} (${((users.length / visitors) * 100).toFixed(2)}%)`}
          description="% of unique visitors"
        />
        <Stat
          title="Avg Session Duration"
          value={`${Math.floor(avgSessionDuration / 60)}m ${Math.floor(
            avgSessionDuration % 60,
          )
            .toString()
            .padStart(2, "0")}s`}
          description="Chat and all"
        />
      </div>
    </div>
  );
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

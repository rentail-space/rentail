import { sumBy } from "es-toolkit";
import type { User } from "prisma/generated/client";

export default function AnalyticsSummary({
  analytics,
  users,
}: {
  analytics: Array<{
    activeUsers: number;
    averageSessionDuration: number;
    date: string;
    sessionSource: string;
  }>;
  users: User[];
}) {
  const activeUsers = sumBy(analytics, (day) => Number(day.activeUsers));

  return (
    <div className="flex flex-col gap-8">
      <div className="mx-auto flex flex-row items-center gap-4">
        <Stat
          title="Active Users"
          value={activeUsers.toLocaleString()}
          description="From page views"
        />
        <Stat
          title="From LLM"
          value={sumBy(
            analytics.filter(
              (entry) =>
                entry.sessionSource === "chatgpt.com" ||
                entry.sessionSource === "perplexity.ai",
            ),
            (entry) => entry.activeUsers,
          ).toLocaleString()}
          description="ChatGPT/Perplexity"
        />
        <Stat
          title="Chats"
          value={users.length.toLocaleString()}
          description={`${((users.length / activeUsers) * 100).toFixed(2)}% of active`}
        />
        <Stat
          title="Session Duration"
          value={`${(
            sumBy(analytics, (entry) => entry.averageSessionDuration) /
              analytics.length
          ).toFixed(0)} sec`}
          description="Seconds"
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

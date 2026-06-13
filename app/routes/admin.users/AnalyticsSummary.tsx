import type { ReactNode } from "react";
import type { Analytics } from "./route";
import type { User } from "prisma/generated";
import { Card, CardContent } from "~/components/ui/Card";
import { meanBy, sumBy } from "es-toolkit";
import { safeParseUtm } from "~/lib/utm";

export default function AnalyticsSummary({
  analytics,
  users,
}: {
  analytics: Analytics[];
  users: User[];
}) {
  return (
    <Card className="bg-secondary-background text-foreground">
      <CardContent>
        <AnalyticsSummaryTable analytics={analytics} users={users} />
      </CardContent>
    </Card>
  );
}

function AnalyticsSummaryTable({
  analytics,
  users,
}: {
  analytics: Analytics[];
  users: User[];
}) {
  const visitors = getVisitors(analytics);
  const chats = getChats(users);
  const avgSessionDuration =
    meanBy(analytics, (entry) => entry.averageSessionDuration) || 0;

  return (
    <section className="grid grid-cols-2 gap-4 md:grid-cols-5">
      <Stat
        title="Unique Visitors"
        value={visitors.all}
        description="From page views"
      />
      <Stat
        title="Visits from LLM"
        value={visitors.fromLLM}
        percentage={visitors.fromLLM / visitors.all}
        description="ChatGPT/Perplexity"
      />
      <Stat
        title="New Chats"
        value={chats.all}
        percentage={chats.all / visitors.all}
        description="% of unique visitors"
      />
      <Stat
        title="Chats from LLM"
        value={chats.fromLLM}
        percentage={chats.fromLLM / chats.all}
        description="ChatGPT/Perplexity"
      />
      <Stat
        title="Avg Session Duration"
        value={
          <span>
            {Math.floor(avgSessionDuration / 60)}m{" "}
            {Math.floor(avgSessionDuration % 60)}s
          </span>
        }
        description="Chat and all"
      />
    </section>
  );
}

function getVisitors(analytics: Analytics[]) {
  const all = sumBy(analytics, (day) => Number(day.visitors));
  const fromLLM = sumBy(
    analytics.filter(
      (entry) =>
        entry.sessionSource === "chatgpt.com" ||
        entry.sessionSource === "perplexity.ai",
    ),
    (entry) => entry.visitors,
  );
  return { all, fromLLM };
}

function getChats(users: User[]) {
  const all = users.length;
  const fromLLM = users.filter((user) => {
    const utm = safeParseUtm(user.utm);
    if (!utm) return false;
    const source =
      utm.source || (utm.referer ? new URL(utm.referer).hostname : undefined);
    return source === "chatgpt.com" || source === "perplexity.ai";
  }).length;
  return { all, fromLLM };
}

function Stat({
  title,
  value,
  percentage,
  description,
}: {
  title: string;
  value: number | ReactNode;
  percentage?: number;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="font-medium text-sm">{title}</div>
      <div className="flex flex-row items-center gap-1 font-bold text-2xl">
        {typeof value === "number" ? (
          <>
            {value.toLocaleString()}
            {percentage !== undefined && Number.isFinite(percentage) && (
              <span className="text-gray-500 text-sm">
                ({(percentage * 100).toFixed(2)}%)
              </span>
            )}
          </>
        ) : (
          value
        )}
      </div>
      <div className="text-gray-500 text-sm">{description}</div>
    </div>
  );
}

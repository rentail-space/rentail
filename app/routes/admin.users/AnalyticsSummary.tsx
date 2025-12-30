import NumberFlow from "@number-flow/react";
import { meanBy, sumBy } from "es-toolkit";
import type { User } from "prisma/generated/client";
import type { ReactNode } from "react";
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
  const avgSessionDuration =
    meanBy(analytics, (entry) => entry.averageSessionDuration) || 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="mx-auto flex flex-row items-center gap-4">
        <Stat
          title="Unique Visitors"
          value={visitors}
          description="From page views"
        />
        <Stat
          title="From LLM"
          value={fromLLM}
          percentage={fromLLM / visitors}
          description="ChatGPT/Perplexity"
        />
        <Stat
          title="New Chats"
          value={users.length}
          percentage={users.length / visitors}
          description="% of unique visitors"
        />
        <Stat
          title="Avg Session Duration"
          value={
            <span>
              <NumberFlow
                format={{ notation: "compact" }}
                value={Math.floor(avgSessionDuration / 60)}
              />
              m{" "}
              <NumberFlow
                format={{ notation: "compact" }}
                value={Math.floor(avgSessionDuration % 60)}
              />
              s
            </span>
          }
          description="Chat and all"
        />
      </div>
    </div>
  );
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
            <NumberFlow format={{ notation: "compact" }} value={value} />
            {percentage !== undefined && Number.isFinite(percentage) && (
              <NumberFlow
                className="text-gray-500 text-sm"
                prefix=" ("
                format={{ notation: "compact" }}
                value={percentage * 100}
                suffix="%)"
              />
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

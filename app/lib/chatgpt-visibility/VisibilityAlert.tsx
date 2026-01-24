import { Section } from "@react-email/components";
import { meanBy, sumBy } from "es-toolkit";
import EmailLayout from "~/emails/EmailLayout";
import { sendEmail } from "~/emails/sendEmails";
import { cn } from "../utils";
import type { Source } from "./runAllQueries";

export default async function sendVisibilityAlert({
  sources,
}: {
  sources: Source[];
}): Promise<void> {
  await sendEmail({
    email: "assaf@labnotes.org",
    subject: "Visibility Alert",
    content: () => (
      <EmailLayout subject={getRecommendation(sources)}>
        <SummarySection sources={sources} />
        <SourcesTable sources={sources} />
      </EmailLayout>
    ),
  });
}

function getRecommendation(sources: Source[]): string {
  const avgScore = meanBy(sources, scoreSource);
  return avgScore >= 90
    ? "Excellent visibility! Rentail.space is dominating ChatGPT search results."
    : avgScore >= 50
      ? "Good visibility. Rentail.space appears consistently in top results."
      : avgScore >= 30
        ? "Visibility declining. Consider content marketing or SEO improvements."
        : "Critical: Low visibility in ChatGPT results. Immediate action needed.";
}

function SummarySection({ sources }: { sources: Source[] }) {
  const avgScore = meanBy(sources, scoreSource);
  const allMentions = sumBy(sources, (source) => source.citations.length);
  const allRentailMentions = sumBy(
    sources,
    (source) =>
      source.citations.filter(
        (citation) => new URL(citation).hostname === "rentail.space",
      ).length,
  );

  return (
    <Section>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 8,
          marginBottom: 8,
          background: "#fff",
        }}
        cellPadding={8}
        border={1}
      >
        <tbody>
          <tr>
            <th align="left" className="whitespace-nowrap bg-gray-200">
              Average score
            </th>
            <td>{avgScore.toLocaleString()}</td>
          </tr>
          <tr>
            <th align="left" className="whitespace-nowrap bg-gray-200">
              All mentions
            </th>
            <td>{allMentions.toLocaleString()}</td>
          </tr>
          <tr>
            <th align="left" className="whitespace-nowrap bg-gray-200">
              Rentail mentions
            </th>
            <td>{allRentailMentions.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

function SourcesTable({ sources }: { sources: Source[] }) {
  return (
    <Section>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 16,
          marginBottom: 16,
          background: "#fff",
        }}
        cellPadding={8}
        border={1}
      >
        <thead>
          <tr>
            <th align="left" className="whitespace-nowrap bg-gray-200">
              Query
            </th>
            <th align="center" className="whitespace-nowrap bg-gray-200">
              Citations
            </th>
            <th align="center" className="whitespace-nowrap bg-gray-200">
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {sources
            .sort((a, b) => a.category.localeCompare(b.category))
            .map((source) => (
              <tr key={source.id}>
                <td align="left">
                  <strong>{source.category}</strong>: {source.query}
                </td>
                <td
                  align="center"
                  className={cn(
                    isRentail(source.citations) > 0 && "font-bold",
                    "whitespace-nowrap",
                  )}
                >
                  {isRentail(source.citations).toLocaleString()} /{" "}
                  {source.citations.length.toLocaleString()}
                </td>
                <td align="right">{scoreSource(source).toLocaleString()}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </Section>
  );
}

function isRentail(citations: string[]): number {
  return citations.filter(
    (citation) => new URL(citation).hostname === "rentail.space",
  ).length;
}

function scoreSource(source: Source): number {
  const isFirstPlace = source.citations[0].includes("rentail.space");
  return (isFirstPlace ? 50 : 0) + isRentail(source.citations) * 10;
}

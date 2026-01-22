import { Section } from "@react-email/components";
import { meanBy, sumBy } from "es-toolkit";
import EmailLayout from "~/emails/EmailLayout";
import { sendEmail } from "~/emails/sendEmails";
import type { Source } from "./runAllQueries";

export default async function sendQueryAlert({
  sources,
}: {
  sources: Source[];
}): Promise<void> {
  await sendEmail({
    email: "assaf@labnotes.org",
    subject: "ChatGPT Visibility Alert",
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
              2+ Citations
            </th>
            <th align="center" className="whitespace-nowrap bg-gray-200">
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {sources
            .sort((a, b) => a.queryId.localeCompare(b.queryId))
            .map((source) => (
              <SourceRecord key={source.queryId} source={source} />
            ))}
        </tbody>
      </table>
    </Section>
  );
}

function SourceRecord({ source }: { source: Source }) {
  const isRentail = source.citations.filter(
    (citation) => new URL(citation).hostname === "rentail.space",
  );
  const score = scoreSource(source);

  return (
    <tr key={source.queryId}>
      <td align="left">
        <strong>{source.queryId}</strong>: {source.query}
      </td>
      <td align="center">{isRentail.length >= 2 ? "🟢" : "🔴"}</td>
      <td align="right">{score.toLocaleString()}</td>
    </tr>
  );
}

function scoreSource(source: Source): number {
  const isFirstPlace = source.citations[0].includes("rentail.space");
  const isRentail = source.citations.filter(
    (citation) => new URL(citation).hostname === "rentail.space",
  );
  return (isFirstPlace ? 50 : 0) + isRentail.length * 10;
}

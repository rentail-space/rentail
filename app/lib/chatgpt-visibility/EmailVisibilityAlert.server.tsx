import { Button, Section } from "@react-email/components";
import { meanBy, sortBy, sumBy } from "es-toolkit";
import { twMerge } from "tailwind-merge";
import EmailLayout from "~/emails/EmailLayout";
import { sendEmail } from "~/emails/sendEmails.server";
import * as styles from "~/emails/styles";
import type { Source } from "./runAllQueries.server";

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

        <Button
          href="https://rentail.space/admin/visibility"
          style={styles.button}
        >
          Charts and Graphs
        </Button>
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
              Total score
            </th>
            <td>{sumBy(sources, scoreSource).toLocaleString()}</td>
          </tr>
          <tr>
            <th align="left" className="whitespace-nowrap bg-gray-200">
              All Citations
            </th>
            <td>
              {sumBy(
                sources,
                (source) => source.citations.length,
              ).toLocaleString()}
            </td>
          </tr>
          <tr>
            <th align="left" className="whitespace-nowrap bg-gray-200">
              Rentail Citations
            </th>
            <td>
              {sumBy(
                sources,
                (source) => source.citations.filter(isRentail).length,
              ).toLocaleString()}
            </td>
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
          {sortBy(sources, ["category", "query"]).map((source) => (
            <tr key={source.id}>
              <td align="left">
                <strong>{source.category}</strong>: {source.query}
              </td>
              <td
                align="center"
                className={twMerge(
                  source.citations.some(isRentail) && "font-bold",
                  "whitespace-nowrap",
                )}
              >
                {countRentail(source.citations).toLocaleString()} /{" "}
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

function countRentail(citations: string[]): number {
  return citations.filter(isRentail).length;
}

function scoreSource(source: Source): number {
  const isFirstPlace = isRentail(source.citations[0]);
  const count = countRentail(source.citations);
  return (isFirstPlace ? 50 : 0) + count * 10;
}

function isRentail(citation?: string): boolean {
  return citation ? new URL(citation).hostname === "rentail.space" : false;
}

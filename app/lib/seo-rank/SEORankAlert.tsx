import { Section } from "@react-email/components";
import { groupBy } from "es-toolkit";
import EmailLayout from "~/emails/EmailLayout";
import { sendEmail } from "~/emails/sendEmails";
import type { RankingResults } from "./checkRanking";

export default async function sendSEORankAlert({
  queries,
}: {
  queries: RankingResults[];
}): Promise<void> {
  await sendEmail({
    email: "assaf@labnotes.org",
    subject: "SEO Rank Alert",
    content: () => (
      <EmailLayout subject={getRecommendation(queries)}>
        <SummarySection queries={queries} />
      </EmailLayout>
    ),
  });
}

function getRecommendation(results: RankingResults[]): string {
  const count = results.filter((result) =>
    result.results.some(isRentailSpace),
  ).length;
  return count >= 8
    ? "Excellent visibility! Rentail.space is dominating ChatGPT search results."
    : count >= 5
      ? "Good visibility. Rentail.space appears consistently in top results."
      : "Visibility declining. Consider content marketing or SEO improvements.";
}

function isRentailSpace({ link }: { link: string }): boolean {
  return new URL(link).hostname === "rentail.space";
}

function SummarySection({ queries }: { queries: RankingResults[] }) {
  const links = queries.flatMap((query) =>
    query.results.map((result) => result.link),
  );
  const hostnames = Object.entries(
    groupBy(links, (link) => new URL(link).hostname),
  ).map(([hostname, group]) => ({
    hostname,
    count: group.length,
  }));

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
              Hostname
            </th>
            <th align="center" className="whitespace-nowrap bg-gray-200">
              Count
            </th>
          </tr>
        </thead>
        <tbody>
          {hostnames
            .sort((a, b) => b.count - a.count)
            .map(({ hostname, count }) => (
              <tr key={hostname}>
                <td align="left">{hostname}</td>
                <td align="right">{count}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </Section>
  );
}

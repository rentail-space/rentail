import { Section } from "@react-email/components";
import EmailLayout from "~/emails/EmailLayout";
import { sendEmail } from "~/emails/sendEmails";
import type { AggregateScore, QueryScore } from "./scorer";

export default async function sendQueryAlert(
  aggregate: AggregateScore,
): Promise<void> {
  await sendEmail({
    email: "assaf@labnotes.org",
    subject: `ChatGPT Visibility Alert - ${aggregate.alertLevel}`,
    content: () => (
      <EmailLayout subject={aggregate.recommendation}>
        <SummarySection aggregate={aggregate} />
        <ScoreTable scores={aggregate.scores} />
      </EmailLayout>
    ),
  });
}

function SummarySection({ aggregate }: { aggregate: AggregateScore }) {
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
            <th align="left" style={{ background: "#f6f8fa" }}>
              Average score
            </th>
            <td>{aggregate.averageScore.toFixed(1)} points</td>
          </tr>
          <tr>
            <th align="left" style={{ background: "#f6f8fa" }}>
              Total mentions
            </th>
            <td>{aggregate.totalMentions}</td>
          </tr>
          <tr>
            <th align="left" style={{ background: "#f6f8fa" }}>
              First place
            </th>
            <td>
              {aggregate.firstPlaceCount}/{aggregate.totalQueries} queries
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

function ScoreTable({ scores }: { scores: QueryScore[] }) {
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
            <th align="left" style={{ background: "#f6f8fa" }}>
              Query
            </th>
            <th align="center" style={{ background: "#f6f8fa" }}>
              Meets Target
            </th>
            <th align="center" style={{ background: "#f6f8fa" }}>
              Rentail Space %
            </th>
          </tr>
        </thead>
        <tbody>
          {scores
            .sort((a, b) => a.queryId.localeCompare(b.queryId))
            .map((score) => (
              <tr key={score.queryId}>
                <td align="left">
                  <strong>{score.queryId}</strong>: {score.query}
                </td>
                <td align="center">{score.meetsTarget ? "🟢" : "🔴"}</td>
                <td align="right">
                  {score.rentailSpacePercentage.toFixed(1)}%
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </Section>
  );
}

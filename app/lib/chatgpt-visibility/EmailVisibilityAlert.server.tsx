import { Button, Section } from "@react-email/components";
import { mean } from "es-toolkit";
import EmailLayout from "~/emails/EmailLayout";
import { sendEmail } from "~/emails/sendEmails.server";
import * as styles from "~/emails/styles";
import prisma from "~/lib/prisma.server";
import { daysAgo } from "~/lib/temporal";
import runAllQueries from "./runAllQueries.server";

type Check = {
  category: string;
  citations: string[];
  mentioned: boolean;
  query: string;
  repetition: number;
};

type Run = {
  checks: Check[];
  createdAt: Date;
  id: string;
};

export default async function sendVisibilityAlert(): Promise<string> {
  await runAllQueries({ newerThan: daysAgo(10) });

  const runs = await prisma.visibilityRun.findMany({
    include: { checks: true },
    orderBy: { createdAt: "asc" },
    where: { createdAt: { gte: daysAgo(90) } },
  });

  await sendEmail({
    email: "assaf@labnotes.org",
    subject: "Visibility Alert",
    content: () => (
      <EmailLayout subject="Rentail visibility in ChatGPT queries">
        <SummarySection runs={runs} />
        <LatestRunTable runs={runs} />
        <Button
          href="https://rentail.space/admin/visibility"
          style={styles.button}
        >
          Charts and Graphs
        </Button>
      </EmailLayout>
    ),
  });

  return "OK";
}

function runVisibilityPct(run: Run): number {
  if (run.checks.length === 0) return 0;
  return mean(run.checks.map((c) => (c.mentioned ? 1 : 0))) * 100;
}

function SummarySection({ runs }: { runs: Run[] }) {
  const last5 = runs.slice(-5);
  const progression = last5.map(
    (run) =>
      `${run.createdAt.toISOString().slice(0, 10)}: ${runVisibilityPct(run).toFixed(0)}%`,
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
            <th
              align="left"
              style={{ background: "#e5e7eb", whiteSpace: "nowrap" }}
            >
              Visibility % (last 5 runs)
            </th>
            <td>{progression.join(" → ")}</td>
          </tr>
          <tr>
            <th
              align="left"
              style={{ background: "#e5e7eb", whiteSpace: "nowrap" }}
            >
              Latest run
            </th>
            <td>{runs.at(-1)?.createdAt.toISOString().slice(0, 10) ?? "—"}</td>
          </tr>
          <tr>
            <th
              align="left"
              style={{ background: "#e5e7eb", whiteSpace: "nowrap" }}
            >
              Total runs tracked
            </th>
            <td>{runs.length}</td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

function LatestRunTable({ runs }: { runs: Run[] }) {
  const latestRun = runs.at(-1);
  if (!latestRun) return null;

  const byQuery = Object.entries(
    latestRun.checks.reduce(
      (acc, c) => {
        if (!acc[c.query]) acc[c.query] = { category: c.category, checks: [] };
        acc[c.query].checks.push(c);
        return acc;
      },
      {} as Record<string, { category: string; checks: Check[] }>,
    ),
  )
    .map(([query, { category, checks }]) => ({
      query,
      category,
      visibilityPct: mean(checks.map((c) => (c.mentioned ? 1 : 0))) * 100,
      avgCitations: mean(checks.map((c) => c.citations.length)),
    }))
    .sort(
      (a, b) =>
        a.category.localeCompare(b.category) || a.query.localeCompare(b.query),
    );

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
            <th
              align="left"
              style={{ background: "#e5e7eb", whiteSpace: "nowrap" }}
            >
              Query
            </th>
            <th
              align="center"
              style={{ background: "#e5e7eb", whiteSpace: "nowrap" }}
            >
              Visibility %
            </th>
            <th
              align="center"
              style={{ background: "#e5e7eb", whiteSpace: "nowrap" }}
            >
              Avg Citations
            </th>
          </tr>
        </thead>
        <tbody>
          {byQuery.map((row) => (
            <tr key={row.query}>
              <td align="left">
                <strong>{row.category}</strong>: {row.query}
              </td>
              <td
                align="center"
                style={{
                  fontWeight: row.visibilityPct > 0 ? "bold" : "normal",
                }}
              >
                {row.visibilityPct.toFixed(0)}%
              </td>
              <td align="right">{row.avgCitations.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

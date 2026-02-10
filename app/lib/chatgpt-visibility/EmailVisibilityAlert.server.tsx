import { Button, Section } from "@react-email/components";
import { last, sortBy, sumBy } from "es-toolkit";
import { DateTime } from "luxon";
import { twMerge } from "tailwind-merge";
import EmailLayout from "~/emails/EmailLayout";
import { sendEmail } from "~/emails/sendEmails.server";
import * as styles from "~/emails/styles";
import type { Source } from "./runAllQueries.server";
import runAllQueries from "./runAllQueries.server";

export default async function sendVisibilityAlert(): Promise<string> {
  const byDate = await runAllQueries({ days: 10 });
  await sendEmail({
    email: "assaf@labnotes.org",
    subject: "Visibility Alert",
    content: () => (
      <EmailLayout subject="Rentail visibility in ChatGPT queries">
        <SummarySection byDate={byDate} />
        <SourcesTable byDate={byDate} />

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

function SummarySection({ byDate }: { byDate: [string, Source[]][] }) {
  const scores: [string, number][] = byDate.map(([date, sources]) => [
    date,
    sumBy(sources, scoreSource),
  ]);
  const citations: [string, number][] = byDate.map(([date, sources]) => [
    date,
    sumBy(sources, (source) => source.citations.length),
  ]);
  const rentailCitations: [string, number][] = byDate.map(([date, sources]) => [
    date,
    sumBy(sources, (source) => source.citations.filter(isRentail).length),
  ]);
  const mostRecent = last(byDate.map(([_date, value]) => value))?.[0];
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
            <td>
              <Progression sequence={scores} />
            </td>
          </tr>
          <tr>
            <th align="left" className="whitespace-nowrap bg-gray-200">
              All Citations
            </th>
            <td>
              <Progression sequence={citations} />
            </td>
          </tr>
          <tr>
            <th align="left" className="whitespace-nowrap bg-gray-200">
              Rentail Citations
            </th>
            <td>
              <Progression sequence={rentailCitations} />
            </td>
          </tr>
          <tr>
            <th align="left" className="whitespace-nowrap bg-gray-200">
              Last updated
            </th>
            <td>
              {mostRecent &&
                DateTime.fromJSDate(mostRecent.createdAt).toFormat(
                  "yyyy-MM-dd",
                )}
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

function Progression({ sequence }: { sequence: [string, number][] }) {
  return sequence.slice(-5).map(([date, value], index, all) => (
    <span className={index === all.length - 1 ? "font-bold" : ""} key={date}>
      {index > 0 ? " → " : ""}
      {value.toLocaleString()}
    </span>
  ));
}

function SourcesTable({ byDate }: { byDate: [string, Source[]][] }) {
  const sources = last(byDate)?.[1];
  if (!sources) return null;
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

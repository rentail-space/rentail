import { Section } from "@react-email/components";
import { twMerge } from "tailwind-merge";
import EmailLayout from "~/emails/EmailLayout";
import { sendEmail } from "~/emails/sendEmails.server";

export default async function sendSEORankAlert(
  engineQueries: {
    engine: string;
    queries: { hostname: string; count: number }[];
  }[],
): Promise<void> {
  await sendEmail({
    email: "assaf@labnotes.org",
    subject: "SEO Rank Alert",
    content: () => (
      <EmailLayout subject="SEO Rank Alert">
        {engineQueries.map(({ engine, queries }) => (
          <SummarySection key={engine} engine={engine} queries={queries} />
        ))}
      </EmailLayout>
    ),
  });
}

const searchEngines = [
  {
    label: "Google",
    id: "google",
  },
  {
    label: "Google AI Mode",
    id: "google_ai_mode",
  },
  {
    label: "Bing",
    id: "bing",
  },
  {
    label: "DuckDuckGo",
    id: "duckduckgo",
  },
];

function SummarySection({
  engine,
  queries,
}: {
  engine: string;
  queries: { hostname: string; count: number }[];
}) {
  return (
    <Section>
      <h2 className="font-bold text-lg">
        {searchEngines.find((e) => e.id === engine)?.label || engine}
      </h2>

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
          {queries.map(({ hostname, count }) => (
            <tr key={hostname}>
              <td
                align="left"
                className={twMerge(hostname === "rentail.space" && "font-bold")}
              >
                {hostname}
              </td>
              <td
                align="right"
                className={twMerge(hostname === "rentail.space" && "font-bold")}
              >
                {count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

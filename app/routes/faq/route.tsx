import fs from "node:fs/promises";
import path from "node:path";
import yaml from "yaml";
import FAQCTA from "./FAQCTA";
import FAQHeader from "./FAQHeader";
import FAQQuestions from "./FAQQuestions";

export const loader = async () => {
  const filePath = path.resolve(import.meta.dirname, "faq.yaml");
  const data = await fs.readFile(filePath, "utf-8");
  const faqs = yaml.parse(data);
  return faqs as {
    category: string;
    questions: { question: string; answer: string }[];
  }[];
};

export default function FAQ({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  const faqs = loaderData;
  return (
    <main className="flex min-h-screen flex-col">
      <FAQHeader />
      <FAQQuestions faqs={faqs} />
      <FAQCTA />
    </main>
  );
}

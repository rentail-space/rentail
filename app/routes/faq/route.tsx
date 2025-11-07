import yaml from "yaml";
import FAQCTA from "./FAQCTA";
import FAQHeader from "./FAQHeader";
import FAQQuestions from "./FAQQuestions";
import faqYaml from "./faq.yaml?raw";

export default function FAQ() {
  const faqs = yaml.parse(faqYaml) as {
    category: string;
    questions: { question: string; answer: string }[];
  }[];
  return (
    <main className="flex min-h-screen flex-col">
      <FAQHeader />
      <FAQQuestions faqs={faqs} />
      <FAQCTA />
    </main>
  );
}

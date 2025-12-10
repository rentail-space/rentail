import FAQCTA from "./FAQCTA";
import FAQHeader from "./FAQHeader";
import FAQQuestions from "./FAQQuestions";

export default function FAQ() {
  return (
    <main className="flex min-h-screen flex-col bg-[hsl(60,100%,99%)]">
      <FAQHeader />
      <FAQQuestions />
      <FAQCTA />
    </main>
  );
}

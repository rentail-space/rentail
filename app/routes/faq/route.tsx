import FAQCTA from "./FAQCTA";
import FAQHeader from "./FAQHeader";
import FAQQuestions from "./FAQQuestions";

export default function FAQ() {
  return (
    <main className="flex min-h-screen flex-col">
      <FAQHeader />
      <FAQQuestions />
      <FAQCTA />
    </main>
  );
}

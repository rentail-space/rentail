import FAQCTA from "./FAQCTA";
import FAQHeader from "./FAQHeader";
import FAQQuestions from "./FAQQuestions";
import faq from "./faq";

export default function FAQ() {
  return (
    <main className="flex min-h-screen flex-col bg-[hsl(60,100%,99%)]">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Server-generated structured data
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaData()),
        }}
      />
      <FAQHeader />
      <FAQQuestions />
      <FAQCTA />
    </main>
  );
}

function schemaData() {
  const mainEntity = faq.flatMap((category) =>
    category.questions.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  );

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity,
  };
}

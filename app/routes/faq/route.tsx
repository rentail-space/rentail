import FAQCTA from "./FAQCTA";
import FAQHeader from "./FAQHeader";
import FAQQuestions from "./FAQQuestions";
import faq from "./faq";

export function meta() {
  return [
    { title: "FAQ - Specialty Leasing Questions | Rentail.space" },
    {
      name: "description",
      content:
        "Frequently asked questions about specialty leasing, kiosk rentals, pop-up shops, and short-term retail spaces in shopping centers. Learn about pricing, booking process, and temporary retail opportunities across the US.",
    },
    {
      name: "keywords",
      content:
        "specialty leasing FAQ, kiosk rental questions, pop-up shop info, mall cart rental, temporary retail FAQ, short-term lease questions",
    },
  ];
}

export default function FAQ() {
  return (
    <main
      className="flex min-h-screen flex-col bg-[hsl(60,100%,99%)]"
      aria-label="Frequently asked questions"
    >
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Server-generated structured data
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaData()),
        }}
      />
      <div className="container mx-auto my-10 p-5">
        <FAQHeader />
        <FAQQuestions />
      </div>
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

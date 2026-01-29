import { ActiveLink } from "~/components/ui/ActiveLink";
import FAQQuestions from "./FAQQuestions";
import faq from "./faq";

export default function FAQ() {
  return (
    <main
      className="flex min-h-screen flex-col bg-[hsl(60,100%,99%)]"
      aria-label="Frequently asked questions"
    >
      <title>FAQ - Specialty Leasing Questions | Rentail.space</title>
      <meta
        name="description"
        content="Frequently asked questions about specialty leasing, kiosk rentals, pop-up shops, and short-term retail spaces in shopping centers. Learn about pricing, booking process, and temporary retail opportunities across the US."
      />
      <meta
        name="keywords"
        content="specialty leasing FAQ, kiosk rental questions, pop-up shop info, mall cart rental, temporary retail FAQ, short-term lease questions"
      />
      <meta
        property="og:title"
        content="FAQ - Specialty Leasing Questions | Rentail.space"
      />
      <meta
        property="og:description"
        content="Frequently asked questions about specialty leasing, kiosk rentals, pop-up shops, and short-term retail spaces in shopping centers."
      />
      <meta
        property="og:image"
        content="https://rentail.space/images/og-image.png"
      />
      <meta property="og:url" content="https://rentail.space/faq" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Rentail.space" />
      <meta property="og:locale" content="en_US" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:title"
        content="FAQ - Specialty Leasing Questions | Rentail.space"
      />
      <meta
        name="twitter:description"
        content="Frequently asked questions about specialty leasing, kiosk rentals, pop-up shops, and short-term retail spaces in shopping centers."
      />
      <meta
        name="twitter:image"
        content="https://rentail.space/images/og-image.png"
      />
      <link rel="canonical" href="https://rentail.space/faq" />

      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Server-generated structured data
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaData()),
        }}
      />

      <section className="mx-auto max-w-4xl bg-[hsl(60,100%,99%)] py-20 text-center">
        <h1 className="mb-6 font-bold text-5xl text-black leading-tight md:text-6xl">
          Frequently Asked Questions
        </h1>
        <p className="font-medium text-black text-xl leading-relaxed md:text-2xl">
          Everything you need to know about finding and renting short-term
          retail spaces.
        </p>
      </section>

      <FAQQuestions />

      <section className="bg-[hsl(47,100%,95%)] py-20 text-center">
        <h2 className="mb-6 font-bold text-4xl text-black leading-tight md:text-5xl">
          Still have questions?
        </h2>
        <p className="mb-8 font-medium text-black text-xl leading-relaxed">
          Our team is here to help. Reach out and we'll get back to you within
          24 hours.
        </p>
        <ActiveLink
          bg="yellow"
          size="xl"
          to={`mailto:hello@rentail.space?subject=${encodeURIComponent("I have questions")}`}
          variant="button"
        >
          Contact Support
        </ActiveLink>
      </section>
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

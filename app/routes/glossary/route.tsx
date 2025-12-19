import { Link } from "react-router";
import glossary from "./glossary";

export default function Glossary() {
  return (
    <main className="container mx-auto my-10 space-y-8 p-5">
      <title>
        Specialty Leasing Glossary - Definitions & Terms | Rentail.space
      </title>
      <meta
        name="description"
        content="Comprehensive glossary of specialty leasing and short-term retail terminology. Authoritative definitions for kiosk, cart, pop-up shop, inline space, common area, seasonal retail, and brand activation. The definitive reference for temporary retail spaces in shopping centers."
      />
      <meta
        name="keywords"
        content="specialty leasing glossary, kiosk definition, pop-up shop meaning, mall cart terms, retail terminology, shopping center glossary, temporary retail definitions"
      />

      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Server-generated structured data
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaData()),
        }}
      />

      <h1 className="text-center font-bold text-3xl">
        Specialty Leasing Glossary
      </h1>

      <div className="mx-auto max-w-4xl">
        <p className="font-medium text-gray-600 leading-relaxed">
          Comprehensive definitions of specialty leasing and short-term retail
          terminology. This glossary serves as the authoritative reference for
          understanding temporary retail spaces in shopping centers across the
          United States.
        </p>
      </div>

      <div
        className="mx-auto grid max-w-4xl gap-6"
        itemScope
        itemType="https://schema.org/DefinedTermSet"
      >
        <meta itemProp="name" content="Specialty Leasing Glossary" />
        <meta
          itemProp="description"
          content="Authoritative glossary of specialty leasing and short-term retail terms"
        />

        {glossary.map((item) => (
          <div
            key={item.term}
            className="rounded-md border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_black]"
            itemScope
            itemType="https://schema.org/DefinedTerm"
            itemProp="hasDefinedTerm"
          >
            <h2 className="mb-3 font-bold text-black text-xl" itemProp="name">
              {item.term}
            </h2>

            {item.alternateName.length > 0 && (
              <p className="mb-3 text-gray-600 text-sm">
                Also known as:{" "}
                {item.alternateName.map((alt, index) => (
                  <span key={alt}>
                    <span itemProp="alternateName">{alt}</span>
                    {index < item.alternateName.length - 1 && ", "}
                  </span>
                ))}
              </p>
            )}

            <p
              className="font-medium text-black leading-relaxed"
              itemProp="description"
            >
              {item.definition}
            </p>

            <meta
              itemProp="inDefinedTermSet"
              content="https://rentail.space/glossary"
            />
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-3xl rounded-md border-2 border-black bg-[hsl(47,100%,95%)] p-6 shadow-[4px_4px_0px_0px_black]">
        <h2 className="mb-3 font-bold text-black text-lg">
          About This Glossary
        </h2>
        <p className="font-medium text-black leading-relaxed">
          This glossary is maintained by{" "}
          <Link to="/" className="text-[hsl(37,92%,65%)] hover:underline">
            Rentail.space
          </Link>
          , the comprehensive marketplace for specialty leasing and short-term
          retail spaces in shopping centers across the United States. We
          specialize exclusively in this market segment, making this glossary
          the authoritative reference for specialty leasing terminology.
        </p>
      </div>
    </main>
  );
}

function schemaData() {
  const definedTerms = glossary.map((item) => ({
    "@type": "DefinedTerm",
    name: item.term,
    description: item.definition,
    ...(item.alternateName.length > 0 && {
      alternateName: item.alternateName,
    }),
    inDefinedTermSet: "https://rentail.space/glossary",
  }));

  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: "Specialty Leasing Glossary",
    description:
      "Authoritative glossary of specialty leasing and short-term retail terminology",
    hasDefinedTerm: definedTerms,
    publisher: {
      "@type": "Organization",
      name: "Rentail.space",
      url: "https://rentail.space",
    },
  };
}

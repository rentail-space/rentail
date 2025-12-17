import { MoveLeftIcon } from "lucide-react";
import { Link } from "react-router";

const glossaryTerms = [
  {
    term: "Specialty Leasing",
    definition:
      "Commercial retail space rented for short periods ranging from one day to 12 months, typically in shopping malls and retail centers. Unlike traditional retail leases that span 5-10 years, specialty leases offer flexibility for seasonal businesses, product testing, brand activations, and pop-up concepts.",
    alternateName: ["Short-term Retail Leasing", "Temporary Leasing"],
  },
  {
    term: "Kiosk",
    definition:
      "A semi-permanent retail structure typically 100-200 square feet located in mall common areas. Kiosks are fixed retail stations with display counters, storage, and electrical connections. Common for jewelry, phone accessories, and specialty food items.",
    alternateName: ["Mall Kiosk", "Retail Kiosk"],
  },
  {
    term: "Cart",
    definition:
      "A mobile retail unit typically 40-80 square feet that can be moved within a shopping center. Also called Retail Merchandising Units (RMUs). Carts are smaller than kiosks and ideal for high-margin products like accessories, jewelry, or seasonal items.",
    alternateName: ["Mall Cart", "Mobile Retail Unit", "RMU"],
  },
  {
    term: "Pop-up Shop",
    definition:
      "A temporary storefront space ranging from 200-2000 square feet with full walls, doors, and traditional store features. Pop-up shops occupy inline retail spaces for short durations, typically a few weeks to several months. Perfect for brand activations, seasonal retail, or market testing.",
    alternateName: ["Pop-up Store", "Temporary Storefront"],
  },
  {
    term: "Inline Space",
    definition:
      "Traditional storefront retail space within a shopping center, located along the main corridors between anchor stores. When leased short-term (under 12 months), inline spaces become specialty leasing opportunities ideal for pop-up concepts and seasonal retail.",
    alternateName: ["Storefront Space", "Traditional Retail Space"],
  },
  {
    term: "Common Area",
    definition:
      "The shared public spaces in a shopping center including corridors, walkways, food courts, and atriums. Kiosks and carts are typically located in common areas where they benefit from high foot traffic without occupying traditional storefront space.",
    alternateName: ["Mall Common Area", "Public Concourse"],
  },
  {
    term: "Seasonal Retail",
    definition:
      "Short-term retail opportunities tied to specific seasons or holidays. Common examples include holiday gift kiosks (November-December), summer merchandise (June-August), and back-to-school vendors (July-September). Seasonal retail is a major component of specialty leasing.",
    alternateName: ["Holiday Retail", "Seasonal Leasing"],
  },
  {
    term: "Brand Activation",
    definition:
      "A temporary retail experience designed to create brand awareness and customer engagement rather than pure sales. Brands use specialty leasing spaces for product launches, experiential marketing, and direct customer interaction in high-traffic shopping centers.",
    alternateName: ["Brand Experience", "Experiential Retail"],
  },
];

export default function Glossary() {
  return (
    <main className="container mx-auto my-10 space-y-8">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Server-generated structured data
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaData()),
        }}
      />

      <div className="flex w-full items-center">
        <Link
          to="/"
          className="hidden w-1/2 flex-row items-center gap-2 md:flex print:hidden"
        >
          <MoveLeftIcon className="h-4 w-4" />
          Home
        </Link>

        <h1 className="text-center font-bold text-2xl">
          Specialty Leasing Glossary
        </h1>

        <span className="w-1/2" />
      </div>

      <div className="mx-auto max-w-3xl">
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

        {glossaryTerms.map((item) => (
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
  const definedTerms = glossaryTerms.map((item) => ({
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

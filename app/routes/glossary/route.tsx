import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/Card";
import pageMeta from "~/lib/pageMeta";
import type { Route } from "./+types/route";
import glossary from "./glossary";

export function meta(): Route.MetaDescriptors {
  return pageMeta({
    title: "Specialty Leasing Glossary - Definitions & Terms",
    description:
      "Comprehensive glossary of specialty leasing and short-term retail terminology. Authoritative definitions for kiosk, cart, pop-up shop, inline space, common area, seasonal retail, and brand activation. The definitive reference for temporary retail spaces in shopping centers.",
    url: "/glossary",
    keywords:
      "specialty leasing glossary, kiosk definition, pop-up shop meaning, mall cart terms, retail terminology, shopping center glossary, temporary retail definitions",
  });
}

export default function Glossary() {
  return (
    <main className="container mx-auto my-10 space-y-8 p-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData()) }}
      />

      <h1 className="text-center font-bold text-3xl">
        Specialty Leasing Glossary
      </h1>

      <p className="mx-auto max-w-4xl font-medium text-gray-600 leading-relaxed">
        Definitions of specialty leasing and short-term retail terminology.
        Everything you need to understand temporary retail spaces in shopping
        centers across the US.
      </p>

      <section
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
          <Card
            className="bg-white"
            itemProp="hasDefinedTerm"
            itemScope
            itemType="https://schema.org/DefinedTerm"
            key={item.term}
          >
            <CardHeader>
              <CardTitle className="font-bold text-xl" itemProp="name">
                {item.term}
              </CardTitle>
              <CardDescription className="text-gray-600 text-sm">
                Also known as:{" "}
                {item.alternateName.map((alt, index) => (
                  <span key={alt}>
                    <span itemProp="alternateName">{alt}</span>
                    {index < item.alternateName.length - 1 && ", "}
                  </span>
                ))}
              </CardDescription>
            </CardHeader>
            <CardContent itemProp="description">{item.definition}</CardContent>

            <meta
              itemProp="inDefinedTermSet"
              content="https://rentail.space/glossary"
            />
          </Card>
        ))}
      </section>

      <Card className="mx-auto max-w-3xl bg-[hsl(47,100%,95%)]">
        <CardHeader>
          <CardTitle className="font-bold text-lg">
            About This Glossary
          </CardTitle>
        </CardHeader>
        <CardContent>
          This glossary is maintained by{" "}
          <Link to="/" className="text-[hsl(37,92%,65%)] hover:underline">
            Rentail.space
          </Link>
          , the marketplace for specialty leasing and short-term retail spaces
          in shopping centers across the United States. We specialize
          exclusively in this market, so we know what these terms actually mean.
        </CardContent>
      </Card>
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

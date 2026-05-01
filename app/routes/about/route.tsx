import { redirect } from "react-router";
import pageMeta from "~/lib/pageMeta";
import type { Route } from "./+types/route";
import AboutCTA from "./AboutCTA";
import AboutHeader from "./AboutHeader";
import AboutMission from "./AboutMission";
import AboutStory from "./AboutStory";
import AboutTeam from "./AboutTeam";
import AboutValues from "./AboutValues";

export function meta(): Route.MetaDescriptors {
  return [
    ...pageMeta({
      title: "About - Making retail space accessible for everyone",
      description:
        "Rentail.space helps micro-merchants find affordable, flexible retail space—making brick-and-mortar accessible to everyone.",
      url: "/about",
      keywords:
        "about rentail.space, retail space, micro-merchants, brick-and-mortar, democratize retail space",
    }),
    {
      tagName: "link",
      href: "https://rentail.space/about.md",
      rel: "alternate",
      type: "text/markdown",
      title: "Markdown version",
    },
  ];
}

export function headers(): HeadersInit {
  return {
    Link: `<https://rentail.space/about.md>; rel="alternate"; type="text/markdown"`,
  };
}

export async function loader() {
  return null;
}

export default function About() {
  return (
    <main
      className="flex min-h-screen flex-col bg-[hsl(60,100%,99%)]"
      aria-label="About page"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData()) }}
      />

      <div className="container mx-auto my-10 space-y-8 p-5">
        <AboutHeader />
        <AboutStory />
        <AboutValues />
        <AboutTeam />
        <AboutMission />
      </div>
      <AboutCTA />
    </main>
  );
}

function schemaData() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Rentail.space",
    description:
      "Learn about Rentail.space, the marketplace making retail space accessible for everyone through specialty leasing and short-term retail opportunities",
    url: "https://rentail.space/about",
    mainEntity: {
      "@type": "Organization",
      "@id": "https://rentail.space#organization",
      name: "Rentail.space",
      alternateName: "Rentail",
      description:
        "Marketplace for specialty leasing and short-term retail spaces in US shopping centers",
      url: "https://rentail.space",
      foundingDate: "2024",
      founder: {
        "@type": "Person",
        name: "Assaf Arkin",
        jobTitle: "CEO",
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Los Angeles",
        addressRegion: "CA",
        addressCountry: "US",
      },
      email: "hello@rentail.space",
      sameAs: ["https://www.linkedin.com/company/rentail-space"],
      knowsAbout: [
        "Specialty Leasing",
        "Short-term Retail Leasing",
        "Mall Kiosks",
        "Pop-up Shops",
        "Temporary Retail Spaces",
      ],
    },
  };
}

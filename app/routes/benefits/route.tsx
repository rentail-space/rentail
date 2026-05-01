import { redirect } from "react-router";
import pageMeta from "~/lib/pageMeta";
import type { Route } from "./+types/route";
import BenefitsCTA from "./BenefitsCTA";
import BenefitsCore from "./BenefitsCore";
import BenefitsHero from "./BenefitsHero";
import BenefitsMore from "./BenefitsMore";
import BenefitsVsTraditional from "./BenefitsVsTraditional";

export function meta(): Route.MetaDescriptors {
  return [
    ...pageMeta({
      title: "Benefits - Why Smart Retailers Choose Rentail.space",
      description:
        "No broker fees, flexible terms, and AI-powered matching. Find short-term retail spaces in shopping centers without the hassle of traditional leasing.",
      url: "/benefits",
      keywords:
        "retail space benefits, no broker fees, flexible retail lease, pop-up shop, short-term retail, shopping center space",
    }),
    {
      tagName: "link",
      href: "https://rentail.space/benefits.md",
      rel: "alternate",
      type: "text/markdown",
      title: "Markdown version",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  if (request.headers.get("accept")?.split(",")[0] === "text/markdown")
    return redirect("/benefits.md", { status: 303 });
  return null;
}

export function headers(): HeadersInit {
  return {
    Link: `<https://rentail.space/benefits.md>; rel="alternate"; type="text/markdown"`,
  };
}

export default function Benefits() {
  return (
    <main
      className="flex min-h-screen flex-col bg-[hsl(60,100%,99%)]"
      aria-label="Benefits page"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaData()),
        }}
      />
      <BenefitsHero />
      <BenefitsCore />
      <BenefitsVsTraditional />
      <BenefitsMore />
      <BenefitsCTA />
    </main>
  );
}

function schemaData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Benefits of Rentail.space for Merchants",
    description:
      "Discover why smart retailers choose Rentail.space for short-term retail spaces in shopping centers. No broker fees, flexible terms, AI-powered matching.",
    url: "https://rentail.space/benefits",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://rentail.space",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Benefits",
          item: "https://rentail.space/benefits",
        },
      ],
    },
  };
}

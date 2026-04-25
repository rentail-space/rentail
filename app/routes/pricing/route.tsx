import { ActiveLink } from "~/components/ui/ActiveLink";
import pageMeta from "~/lib/pageMeta";
import type { Route } from "./+types/route";
import PricingFAQ from "./PricingFAQ";
import PricingPlans from "./PricingPlans";

export function meta(): Route.MetaDescriptors {
  return pageMeta({
    title: "Pricing",
    description:
      "Compare our simple, transparent pricing plans for specialty leasing. Find the right solution for your business—no hidden fees, no surprises.",
    url: "/pricing",
    keywords: "pricing, specialty leasing, retail spaces, rentail.space",
  });
}

export default function Pricing() {
  return (
    <main
      className="flex min-h-screen flex-col bg-[hsl(60,100%,99%)]"
      aria-label="Pricing"
    >
      <script
        type="application/ld+json"
        // oxlint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Pricing | Rentail.space",
            description:
              "Compare our simple, transparent pricing plans for specialty leasing",
            url: "https://rentail.space/pricing",
            mainEntity: [
              {
                "@type": "Offer",
                name: "For Merchants",
                description:
                  "Find and lease retail spaces with zero platform fees",
                price: "0",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
                seller: {
                  "@type": "Organization",
                  name: "Rentail.space",
                },
                itemOffered: {
                  "@type": "Service",
                  name: "Specialty Retail Space Discovery",
                  description:
                    "Browse retail spaces, AI-powered recommendations, direct messaging with property managers",
                },
              },
              {
                "@type": "Offer",
                name: "Space Listing",
                description:
                  "List your retail spaces and attract quality merchants",
                price: "15",
                priceCurrency: "USD",
                priceSpecification: {
                  "@type": "UnitPriceSpecification",
                  price: "15",
                  priceCurrency: "USD",
                  referenceQuantity: {
                    "@type": "QuantitativeValue",
                    value: "1",
                    unitText: "PERCENT",
                  },
                },
                availability: "https://schema.org/InStock",
                seller: {
                  "@type": "Organization",
                  name: "Rentail.space",
                },
                itemOffered: {
                  "@type": "Service",
                  name: "Space Listing Service",
                  description:
                    "List unlimited retail spaces with AI-powered merchant matching and automated lease management",
                },
              },
              {
                "@type": "Offer",
                name: "Specialty Leasing Booking App",
                description:
                  "Complete booking management for your shopping center",
                price: "250",
                priceCurrency: "USD",
                priceSpecification: {
                  "@type": "UnitPriceSpecification",
                  price: "250",
                  priceCurrency: "USD",
                  unitText: "MONTH",
                  referenceQuantity: {
                    "@type": "QuantitativeValue",
                    value: "1",
                    unitText: "SHOPPING_CENTER",
                  },
                },
                availability: "https://schema.org/InStock",
                seller: {
                  "@type": "Organization",
                  name: "Rentail.space",
                },
                itemOffered: {
                  "@type": "SoftwareApplication",
                  name: "Specialty Leasing Booking App",
                  description:
                    "Custom booking calendar, automated scheduling, analytics dashboard, multi-location management",
                  applicationCategory: "BusinessApplication",
                  operatingSystem: "Web",
                },
              },
            ],
          }),
        }}
      />

      <div className="container mx-auto my-10 space-y-8 p-5">
        <section className="bg-[hsl(60,100%,99%)] py-20 text-center">
          <h1 className="mb-6 font-bold text-5xl text-black leading-tight md:text-6xl">
            Simple, transparent pricing
          </h1>
          <p className="font-medium text-black text-xl leading-relaxed md:text-2xl">
            Choose the plan that works best for your business. No hidden fees,
            no surprises.
          </p>
        </section>

        <PricingPlans />
        <PricingFAQ />
      </div>

      <section className="bg-[hsl(47,100%,95%)] px-4 py-20">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="mb-6 font-bold text-4xl text-black leading-tight md:text-5xl">
            Ready to get started?
          </h2>
          <p className="mb-8 font-medium text-black text-xl leading-relaxed">
            Start finding your perfect retail space today.
          </p>
          <ActiveLink to="/chat" variant="button" bg="yellow" size="xl">
            Get Started Now
          </ActiveLink>
        </div>
      </section>
    </main>
  );
}

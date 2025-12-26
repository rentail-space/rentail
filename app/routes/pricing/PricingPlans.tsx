import { Check } from "lucide-react";
import { ActiveLink } from "~/components/ui/ActiveLink";
import { Badge } from "~/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { cn } from "~/lib/utils";

const merchantPlans = {
  name: "For Merchants",
  description: "Find and lease retail spaces with zero platform fees",
  price: "Free",
  period: "forever",
  features: [
    "Browse all available retail spaces",
    "AI-powered space recommendations",
    "Direct messaging with property managers",
    "Book spaces instantly",
    "Mobile app access",
    "Only pay rent and utilities directly to property owner",
    "No platform fees, no commissions",
  ],
  cta: "Get Started",
  href: "/chat",
  highlighted: true,
};

const mallPlans = [
  {
    name: "Space Listing",
    description: "List your retail spaces and attract quality merchants",
    price: "15%",
    period: "commission",
    features: [
      "List unlimited retail spaces",
      "AI-powered merchant matching",
      "Automated lease management",
      "Direct merchant communication",
      "Payment processing included",
      "Lower than any agency (typically 20-30%)",
      "Only pay when you earn",
    ],
    cta: "Contact Sales",
    href: `mailto:hello@rentail.space?subject=${encodeURIComponent("Space Listing Inquiry")}`,
    highlighted: false,
  },
  {
    name: "Specialty Leasing Booking App",
    description: "Complete booking management for your shopping center",
    price: "$250",
    period: "per month per shopping center",
    features: [
      "Everything in Space Listing",
      "Custom booking calendar",
      "Automated scheduling system",
      "Advanced analytics dashboard",
      "Multi-location management",
      "Priority support",
      "Custom integrations",
      "White-label options available",
    ],
    cta: "Contact Sales",
    href: `mailto:hello@rentail.space?subject=${encodeURIComponent("Specialty Leasing Booking App Inquiry")}`,
    highlighted: false,
  },
];

export default function PricingPlans() {
  return (
    <section className="space-y-20">
      <div className="container mx-auto max-w-7xl bg-[hsl(60,100%,99%)]">
        <h2 className="mb-4 text-center font-bold text-3xl text-black leading-tight">
          For Merchants
        </h2>
        <p className="mb-12 text-center font-medium text-black text-lg leading-relaxed">
          Find and lease retail spaces with zero platform fees
        </p>

        <div className="mx-auto grid max-w-xl grid-cols-1 hover:rotate-1">
          <PricingPlan plan={merchantPlans} />
        </div>
      </div>

      <div className="container mx-auto max-w-7xl bg-[hsl(60,100%,99%)]">
        <h2 className="mb-4 text-center font-bold text-3xl text-black leading-tight">
          For Shopping Centers & Malls
        </h2>
        <p className="mb-12 text-center font-medium text-black text-lg leading-relaxed">
          List your spaces and grow your revenue with our platform
        </p>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {mallPlans.map((plan) => (
            <PricingPlan key={plan.name} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingPlan({
  plan,
}: {
  plan: {
    name: string;
    description: string;
    price: string;
    period: string;
    features: string[];
    cta: string;
    href: string;
    highlighted: boolean;
  };
}) {
  return (
    <Card
      key={plan.name}
      className={cn(
        "relative flex flex-col rounded-md border-2 border-black bg-white p-8",
        plan.highlighted
          ? "shadow-[8px_8px_0px_0px_black]"
          : "shadow-[4px_4px_0px_0px_black]",
      )}
    >
      {plan.highlighted && (
        <Badge className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[hsl(37,92%,65%)] text-md">
          Most Popular
        </Badge>
      )}

      <CardHeader>
        <CardTitle>
          <div className="mb-6">
            <h3 className="mb-2 font-bold text-2xl text-black">{plan.name}</h3>
            <p className="font-medium text-black text-sm">{plan.description}</p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-5xl text-black">{plan.price}</span>
          <span className="font-medium text-black text-md">{plan.period}</span>
        </div>

        <ActiveLink
          bg={plan.highlighted ? "yellow" : "white"}
          className={"w-full px-6 py-3 text-center"}
          size="xl"
          to={plan.href}
          variant="button"
        >
          {plan.cta}
        </ActiveLink>

        <ul className="flex flex-col gap-4">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <Check className="h-5 w-5 shrink-0 text-[hsl(37,92%,65%)]" />
              <span className="font-medium text-black text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

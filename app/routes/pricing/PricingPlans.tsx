import { Check } from "lucide-react";
import { Link } from "react-router";

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
    <>
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-7xl">
          <h2 className="mb-4 text-center font-bold text-3xl text-gray-900">
            For Merchants
          </h2>
          <p className="mb-12 text-center text-gray-600 text-lg">
            Find and lease retail spaces with zero platform fees
          </p>

          <div className="mx-auto grid max-w-xl grid-cols-1">
            <PricingPlan plan={merchantPlans} />
          </div>
        </div>
      </section>

      <section className="bg-gray-50 px-4 py-20">
        <div className="container mx-auto max-w-7xl">
          <h2 className="mb-4 text-center font-bold text-3xl text-gray-900">
            For Shopping Centers & Malls
          </h2>
          <p className="mb-12 text-center text-gray-600 text-lg">
            List your spaces and grow your revenue with our platform
          </p>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {mallPlans.map((plan) => (
              <PricingPlan key={plan.name} plan={plan} />
            ))}
          </div>
        </div>
      </section>
    </>
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
    <div
      key={plan.name}
      className={`relative flex flex-col rounded-2xl border-2 bg-white p-8 shadow-lg transition-all hover:shadow-2xl ${
        plan.highlighted
          ? "border-blue-600 ring-4 ring-blue-100"
          : "border-gray-200"
      }`}
    >
      {plan.highlighted && (
        <div className="-top-4 -translate-x-1/2 absolute left-1/2 rounded-full bg-blue-600 px-4 py-1 font-semibold text-sm text-white">
          Most Popular
        </div>
      )}

      <div className="mb-6">
        <h3 className="mb-2 font-bold text-2xl text-gray-900">{plan.name}</h3>
        <p className="text-gray-600 text-sm">{plan.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-5xl text-gray-900">{plan.price}</span>
          <span className="text-gray-600 text-sm">{plan.period}</span>
        </div>
      </div>

      <Link
        to={plan.href}
        className={`mb-8 inline-flex items-center justify-center rounded-xl px-6 py-3 text-center font-semibold transition-all ${
          plan.highlighted
            ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg"
            : "border-2 border-gray-300 bg-white text-gray-700 hover:border-blue-600 hover:text-blue-600"
        }`}
      >
        {plan.cta}
      </Link>

      <ul className="flex flex-col gap-4">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check className="h-5 w-5 shrink-0 text-blue-600" />
            <span className="text-gray-700 text-sm">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

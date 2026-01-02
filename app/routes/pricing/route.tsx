import { ActiveLink } from "~/components/ui/ActiveLink";
import PricingFAQ from "./PricingFAQ";
import PricingPlans from "./PricingPlans";

export default function Pricing() {
  return (
    <main className="flex min-h-screen flex-col bg-[hsl(60,100%,99%)]">
      <title>Pricing | Rentail.space</title>
      <meta
        name="description"
        content="Compare our simple, transparent pricing plans for specialty leasing. Find the right solution for your business—no hidden fees, no surprises."
      />
      <meta
        name="keywords"
        content="pricing, specialty leasing, retail spaces, rentail.space"
      />
      <link rel="canonical" href="https://rentail.space/pricing" />

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

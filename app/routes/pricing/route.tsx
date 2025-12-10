import PricingCTA from "./PricingCTA";
import PricingFAQ from "./PricingFAQ";
import PricingHeader from "./PricingHeader";
import PricingPlans from "./PricingPlans";

export default function Pricing() {
  return (
    <main className="flex min-h-screen flex-col bg-[hsl(60,100%,99%)]">
      <PricingHeader />
      <PricingPlans />
      <PricingFAQ />
      <PricingCTA />
    </main>
  );
}

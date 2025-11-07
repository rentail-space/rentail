import PricingCTA from "./PricingCTA";
import PricingFAQ from "./PricingFAQ";
import PricingHeader from "./PricingHeader";
import PricingPlans from "./PricingPlans";

export const handle = { showHeader: true, showFooter: true };

export default function Pricing() {
  return (
    <main className="flex min-h-screen flex-col">
      <PricingHeader />
      <PricingPlans />
      <PricingFAQ />
      <PricingCTA />
    </main>
  );
}

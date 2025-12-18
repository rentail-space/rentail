import PricingCTA from "./PricingCTA";
import PricingFAQ from "./PricingFAQ";
import PricingHeader from "./PricingHeader";
import PricingPlans from "./PricingPlans";

export default function Pricing() {
  return (
    <main className="flex min-h-screen flex-col bg-[hsl(60,100%,99%)]">
      <div className="container mx-auto my-10 space-y-8 p-5">
        <PricingHeader />
        <PricingPlans />
        <PricingFAQ />
      </div>
      <PricingCTA />
    </main>
  );
}

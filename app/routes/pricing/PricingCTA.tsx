import { ActiveLink } from "~/components/ui/ActiveLink";

export default function PricingCTA() {
  return (
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
  );
}

import { ActiveLink } from "~/components/ui/ActiveLink";

export default function BenefitsHero() {
  return (
    <section className="bg-[hsl(60,100%,99%)] px-5 py-20">
      <div className="container mx-auto max-w-4xl text-center">
        <h1 className="mb-6 font-bold text-5xl text-black leading-tight md:text-6xl">
          Why Smart Retailers Choose{" "}
          <span className="text-[hsl(37,92%,65%)]">Rentail.space</span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl font-medium text-black text-xl leading-relaxed">
          Short-term retail in shopping centers—without the broker fees, long
          leases, or runaround. Book your space today, sell tomorrow.
        </p>
        <ActiveLink to="/chat" variant="button" bg="yellow" size="xl">
          Find My Space
        </ActiveLink>
      </div>
    </section>
  );
}

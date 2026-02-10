import { Store } from "lucide-react";
import { ActiveLink } from "~/components/ui/ActiveLink";

export default function BenefitsCTA() {
  return (
    <section className="bg-[hsl(47,100%,95%)] px-5 py-20">
      <div className="container mx-auto max-w-3xl text-center">
        <div className="mb-8 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-md border-2 border-black bg-[hsl(37,92%,65%)] shadow-[4px_4px_0px_0px_black]">
            <Store className="h-10 w-10 text-black" />
          </div>
        </div>
        <h2 className="mb-6 font-bold text-4xl text-black leading-tight md:text-5xl">
          Ready to Find Your Space?
        </h2>
        <p className="mb-8 font-medium text-black text-xl leading-relaxed">
          Tell our AI what you're selling and where. We'll match you with the
          right shopping center space in minutes.
        </p>
        <ActiveLink to="/chat" variant="button" bg="yellow" size="xl">
          Find My Space
        </ActiveLink>
      </div>
    </section>
  );
}

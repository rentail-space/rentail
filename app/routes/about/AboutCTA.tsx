import { Building2 } from "lucide-react";
import { ActiveLink } from "~/components/ui/ActiveLink";

export default function AboutCTA() {
  return (
    <section className="bg-[hsl(47,100%,95%)] px-5 py-20">
      <div className="container mx-auto max-w-3xl text-center">
        <div className="mb-8 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-md border-2 border-black bg-[hsl(37,92%,65%)] shadow-[4px_4px_0px_0px_black]">
            <Building2 className="h-10 w-10 text-black" />
          </div>
        </div>
        <h2 className="mb-6 font-bold text-4xl text-black leading-tight md:text-5xl">
          Join us on our journey
        </h2>
        <p className="mb-8 font-medium text-black text-xl leading-relaxed">
          Whether you're a merchant looking for space or a property owner with
          space to fill, we'd love to work with you.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <ActiveLink variant="button" to="/chat" bg="yellow" size="xl">
            Find a Space
          </ActiveLink>
          <ActiveLink
            className="px-8"
            size="xl"
            to="mailto:hello@rentail.space"
            variant="button"
          >
            Get in Touch
          </ActiveLink>
        </div>
      </div>
    </section>
  );
}

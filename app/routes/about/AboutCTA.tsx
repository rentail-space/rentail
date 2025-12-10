import { Building2 } from "lucide-react";
import { Link } from "react-router";

export default function AboutCTA() {
  return (
    <section className="bg-[hsl(47,100%,95%)] px-4 py-20">
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
          <Link
            to="/chat"
            className="inline-flex transform items-center justify-center rounded-md border-2 border-black bg-[hsl(37,92%,65%)] px-8 py-4 font-bold text-black text-lg shadow-[4px_4px_0px_0px_black] transition-all duration-100 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_black]"
          >
            Find a Space
          </Link>
          <Link
            to="mailto:hello@rentail.space"
            className="inline-flex transform items-center justify-center rounded-md border-2 border-black bg-white px-8 py-4 font-bold text-black text-lg shadow-[4px_4px_0px_0px_black] transition-all duration-100 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_black]"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </section>
  );
}

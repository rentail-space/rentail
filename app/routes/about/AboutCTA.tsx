import { Building2 } from "lucide-react";
import { Link } from "react-router";

export default function AboutCTA() {
  return (
    <section className="bg-linear-to-br from-blue-600 to-indigo-700 px-4 py-20">
      <div className="container mx-auto max-w-3xl text-center">
        <div className="mb-8 flex justify-center">
          <Building2 className="h-16 w-16 text-white" />
        </div>
        <h2 className="mb-6 font-bold text-4xl text-white md:text-5xl">
          Join us on our journey
        </h2>
        <p className="mb-8 text-blue-100 text-xl">
          Whether you're a merchant looking for space or a property owner with
          space to fill, we'd love to work with you.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            to="/chat"
            className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 font-semibold text-blue-600 text-lg transition-all hover:bg-blue-50 hover:shadow-lg"
          >
            Find a Space
          </Link>
          <Link
            to="mailto:hello@rentail.space"
            className="inline-flex items-center justify-center rounded-xl border-2 border-white bg-transparent px-8 py-4 font-semibold text-lg text-white transition-all hover:bg-white/10"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </section>
  );
}

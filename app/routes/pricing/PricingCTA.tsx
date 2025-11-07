import { Link } from "react-router";

export default function PricingCTA() {
  return (
    <section className="bg-linear-to-br from-blue-600 to-indigo-700 px-4 py-20">
      <div className="container mx-auto max-w-3xl text-center">
        <h2 className="mb-6 font-bold text-4xl text-white md:text-5xl">
          Ready to get started?
        </h2>
        <p className="mb-8 text-blue-100 text-xl">
          Start finding your perfect retail space today.
        </p>
        <Link
          to="/chat"
          className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 font-semibold text-blue-600 text-lg transition-all hover:bg-blue-50 hover:shadow-lg"
        >
          Get Started Now
        </Link>
      </div>
    </section>
  );
}

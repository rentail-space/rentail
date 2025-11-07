import { Link } from "react-router";

export default function FAQCTA() {
  return (
    <section className="bg-linear-to-br from-blue-600 to-indigo-700 px-4 py-20">
      <div className="container mx-auto max-w-3xl text-center">
        <h2 className="mb-6 font-bold text-4xl text-white md:text-5xl">
          Still have questions?
        </h2>
        <p className="mb-8 text-blue-100 text-xl">
          Our team is here to help. Reach out and we'll get back to you within
          24 hours.
        </p>
        <Link
          to="mailto:hello@rentail.space"
          className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 font-semibold text-blue-600 text-lg transition-all hover:bg-blue-50 hover:shadow-lg"
        >
          Contact Support
        </Link>
      </div>
    </section>
  );
}

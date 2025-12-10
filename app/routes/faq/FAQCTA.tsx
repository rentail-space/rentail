import { Link } from "react-router";

export default function FAQCTA() {
  return (
    <section className="bg-[hsl(47,100%,95%)] px-4 py-20">
      <div className="container mx-auto max-w-3xl text-center">
        <h2 className="mb-6 font-bold text-4xl text-black leading-tight md:text-5xl">
          Still have questions?
        </h2>
        <p className="mb-8 font-medium text-black text-xl leading-relaxed">
          Our team is here to help. Reach out and we'll get back to you within
          24 hours.
        </p>
        <Link
          to={`mailto:hello@rentail.space?subject=${encodeURIComponent("I have questions")}`}
          className="inline-flex transform items-center justify-center rounded-[10px] border-2 border-black bg-[hsl(37,92%,65%)] px-8 py-4 font-bold text-black text-lg shadow-[4px_4px_0px_0px_black] transition-all duration-100 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_black]"
        >
          Contact Support
        </Link>
      </div>
    </section>
  );
}

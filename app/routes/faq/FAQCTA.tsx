import { ActiveLink } from "~/components/ui/ActiveLink";

export default function FAQCTA() {
  return (
    <section className="bg-[hsl(47,100%,95%)] py-20 text-center">
      <h2 className="mb-6 font-bold text-4xl text-black leading-tight md:text-5xl">
        Still have questions?
      </h2>
      <p className="mb-8 font-medium text-black text-xl leading-relaxed">
        Our team is here to help. Reach out and we'll get back to you within 24
        hours.
      </p>
      <ActiveLink
        bg="yellow"
        size="xl"
        to={`mailto:hello@rentail.space?subject=${encodeURIComponent("I have questions")}`}
        variant="button"
      >
        Contact Support
      </ActiveLink>
    </section>
  );
}

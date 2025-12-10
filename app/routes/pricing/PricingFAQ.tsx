const faq = [
  {
    question: "How does the 15% commission work for malls?",
    answer:
      "We only charge 15% commission on completed bookings. This is significantly lower than traditional agencies which typically charge 20-30%. You only pay when you earn revenue.",
  },
  {
    question: "Is the platform really free for merchants?",
    answer:
      "Yes! Merchants can browse, search, and book spaces completely free. You only pay rent and utilities directly to the property owner. No platform fees, no commissions, no hidden costs.",
  },
  {
    question: "What's included in the Specialty Leasing Booking App?",
    answer:
      "The $250/month per shopping center includes a complete booking management system with automated scheduling, analytics, multi-location support, and priority customer support. Perfect for managing specialty leasing across your portfolio.",
  },
  {
    question: "Can I cancel the booking app subscription anytime?",
    answer:
      "Yes, you can cancel your Specialty Leasing Booking App subscription at any time. There are no long-term commitments or cancellation fees.",
  },
];

export default function PricingFAQ() {
  return (
    <section className="bg-[hsl(60,100%,99%)] px-4 py-20">
      <div className="container mx-auto max-w-3xl">
        <h2 className="mb-12 text-center font-bold text-4xl text-black leading-tight">
          Frequently asked questions
        </h2>

        <div className="flex flex-col gap-6">
          {faq.map((faq) => (
            <div
              key={faq.question}
              className="rounded-md border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_black]"
            >
              <h3 className="mb-3 font-bold text-black text-xl">
                {faq.question}
              </h3>
              <p className="font-medium text-black leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

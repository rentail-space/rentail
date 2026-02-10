import { BadgeDollarSign, Bot, CalendarDays } from "lucide-react";

const benefits = [
  {
    icon: <BadgeDollarSign className="h-8 w-8" />,
    title: "No Broker Fees",
    description:
      "Zero platform fees for merchants. You see the price, you pay the price. No hidden markups, no broker commissions, no surprises.",
  },
  {
    icon: <Bot className="h-8 w-8" />,
    title: "AI-Powered Matching",
    description:
      "Our AI finds spaces with the right foot traffic for your products. Tell us what you sell—we find where your customers already shop.",
  },
  {
    icon: <CalendarDays className="h-8 w-8" />,
    title: "Flexible Terms",
    description:
      "Daily, weekly, or monthly. Test a new market before committing. Run your holiday pop-up without a multi-year lease hanging over you.",
  },
];

export default function BenefitsCore() {
  return (
    <section className="bg-[hsl(47,100%,95%)] px-4 py-20">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-bold text-4xl text-black leading-tight md:text-5xl">
            Built for Merchants, Not Brokers
          </h2>
          <p className="mx-auto max-w-2xl font-medium text-black text-xl leading-relaxed">
            Every feature designed around what retailers actually need.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="group relative transform rounded-md border-2 border-black bg-white p-8 shadow-[4px_4px_0px_0px_black] transition-all duration-100 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_black]"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-md border-2 border-black bg-[hsl(37,92%,65%)] text-black shadow-[2px_2px_0px_0px_black]">
                {benefit.icon}
              </div>
              <h3 className="mb-4 font-bold text-black text-xl">
                {benefit.title}
              </h3>
              <p className="font-medium text-black leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

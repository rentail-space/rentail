import { Check, X } from "lucide-react";

const rows = [
  {
    label: "Speed to book",
    rentail: "Minutes",
    traditional: "Weeks to months",
  },
  {
    label: "Commitment",
    rentail: "Days, weeks, or months",
    traditional: "1–10 year leases",
  },
  {
    label: "Fees",
    rentail: "None",
    traditional: "Broker fees + legal costs",
  },
  {
    label: "Support",
    rentail: "AI + human support",
    traditional: "On your own",
  },
  {
    label: "Availability",
    rentail: "24/7 self-service",
    traditional: "Business hours only",
  },
];

export default function BenefitsVsTraditional() {
  return (
    <section className="bg-[hsl(60,100%,99%)] px-4 py-20">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-bold text-4xl text-black leading-tight md:text-5xl">
            Rentail vs. Traditional Leasing
          </h2>
          <p className="font-medium text-black text-xl leading-relaxed">
            The old way is slow, expensive, and built for landlords. We fixed
            that.
          </p>
        </div>

        <div className="overflow-hidden rounded-md border-2 border-black shadow-[4px_4px_0px_0px_black]">
          {/* Header */}
          <div className="grid grid-cols-3 border-black border-b-2 bg-black text-white">
            <div className="px-6 py-4 font-bold" />
            <div className="border-black border-l-2 bg-[hsl(37,92%,65%)] px-6 py-4 text-center font-bold text-black text-lg">
              Rentail.space
            </div>
            <div className="border-black border-l-2 px-6 py-4 text-center font-bold text-lg">
              Traditional Leasing
            </div>
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-3 border-black border-b-2 last:border-b-0 ${
                i % 2 === 0 ? "bg-white" : "bg-[hsl(60,100%,97%)]"
              }`}
            >
              <div className="px-6 py-5 font-bold text-black">{row.label}</div>
              <div className="flex items-center gap-2 border-black border-l-2 bg-[hsl(47,100%,92%)] px-6 py-5 font-medium text-black">
                <Check className="h-5 w-5 shrink-0 text-green-700" />
                {row.rentail}
              </div>
              <div className="flex items-center gap-2 border-black border-l-2 px-6 py-5 font-medium text-black">
                <X className="h-5 w-5 shrink-0 text-red-600" />
                {row.traditional}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { Clock, MapPin, ShoppingBag, Sparkles, UserCheck } from "lucide-react";

const items = [
  {
    icon: <Clock className="h-6 w-6" />,
    title: "24/7 Self-Service",
    description:
      "Browse spaces, compare options, and book at midnight if that's when inspiration strikes. No waiting for business hours.",
  },
  {
    icon: <MapPin className="h-6 w-6" />,
    title: "Nationwide Network",
    description:
      "Thousands of shopping centers across the US. From major malls to neighborhood strip centers—wherever your customers are.",
  },
  {
    icon: <ShoppingBag className="h-6 w-6" />,
    title: "Seasonal and Pop-Up Ready",
    description:
      "Holiday season? Local event? Weekend market? Rent for exactly as long as you need. No year-round commitment required.",
  },
  {
    icon: <UserCheck className="h-6 w-6" />,
    title: "Direct Booking",
    description:
      "No middlemen taking a cut. You deal directly with property managers through our platform, keeping costs down.",
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: "AI Recommendations",
    description:
      "Tell us your product category and target customer. Our AI matches you with spaces where your specific buyers already shop.",
  },
];

export default function BenefitsMore() {
  return (
    <section className="bg-[hsl(47,100%,95%)] px-4 py-20">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-bold text-4xl text-black leading-tight md:text-5xl">
            More Reasons to Choose Rentail
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-4 rounded-md border-2 border-black bg-white p-6 shadow-[3px_3px_0px_0px_black]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border-2 border-black bg-[hsl(37,92%,65%)] text-black shadow-[2px_2px_0px_0px_black]">
                {item.icon}
              </div>
              <div>
                <h3 className="mb-2 font-bold text-black">{item.title}</h3>
                <p className="font-medium text-black text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

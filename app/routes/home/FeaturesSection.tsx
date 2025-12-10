import { CircleDollarSign, Clock, Pen, Shield, Users, Zap } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Find the Perfect Space",
      description:
        "AI-powered matching finds retail spaces with the foot traffic and location your business needs to thrive.",
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "24/7 Availability",
      description:
        "Browse and book retail spaces anytime, anywhere. No waiting for business hours or property managers.",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Seamless Booking",
      description:
        "Sign up once to access all shopping centers in your area. We handle contracts and payment processing.",
    },
  ];

  const benefits = [
    {
      icon: <CircleDollarSign className="h-6 w-6" />,
      title: "Flexible Pricing",
      description: "Daily, weekly, or monthly rates that fit your budget",
    },
    {
      icon: <Pen className="h-6 w-6" />,
      title: "No Long-term Commitment",
      description: "Test markets without multi-year leases",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Dedicated Support",
      description: "Expert help throughout your rental journey",
    },
  ];

  return (
    <section className="bg-[hsl(60,100%,99%)] px-4 py-20">
      <div className="container mx-auto max-w-7xl">
        {/* Main Features */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-bold text-4xl text-black leading-tight md:text-5xl">
            Why Choose <span className="text-[hsl(37,92%,65%)]">rentail</span>
            .space?
          </h2>
          <p className="mx-auto max-w-3xl font-medium text-black text-xl leading-relaxed">
            We help you find short-term retail spaces in shopping centers near
            you, at reasonable prices, with the foot traffic to make your
            business succeed.
          </p>
        </div>

        <div className="mb-20 grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative transform rounded-[10px] border-2 border-black bg-white p-8 shadow-[4px_4px_0px_0px_black] transition-all duration-100 hover:shadow-[6px_6px_0px_0px_black] hover:translate-x-[-2px] hover:translate-y-[-2px]"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[10px] border-2 border-black bg-[hsl(37,92%,65%)] text-black shadow-[2px_2px_0px_0px_black]">
                {feature.icon}
              </div>
              <h3 className="mb-4 font-bold text-black text-xl">
                {feature.title}
              </h3>
              <p className="font-medium text-black leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Additional Benefits */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="flex items-start gap-4 rounded-[10px] border-2 border-black bg-white p-6 shadow-[3px_3px_0px_0px_black]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[5px] border-2 border-black bg-[hsl(37,92%,65%)] text-black shadow-[2px_2px_0px_0px_black]">
                {benefit.icon}
              </div>
              <div>
                <h4 className="mb-2 font-bold text-black">{benefit.title}</h4>
                <p className="font-medium text-black text-sm">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

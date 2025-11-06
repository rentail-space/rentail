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
    <section className="px-4 py-20">
      <div className="container mx-auto max-w-7xl">
        {/* Main Features */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-bold text-4xl text-gray-900 md:text-5xl">
            Why Choose <span className="text-blue-600">rentail</span>.space?
          </h2>
          <p className="mx-auto max-w-3xl text-gray-600 text-xl">
            We help you find short-term retail spaces in shopping centers near
            you, at reasonable prices, with the foot traffic to make your
            business succeed.
          </p>
        </div>

        <div className="mb-20 grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:border-blue-500 hover:shadow-xl"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                {feature.icon}
              </div>
              <h3 className="mb-4 font-bold text-gray-900 text-xl">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
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
              className="flex items-start gap-4 rounded-xl bg-blue-50 p-6"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                {benefit.icon}
              </div>
              <div>
                <h4 className="mb-2 font-semibold text-gray-900">
                  {benefit.title}
                </h4>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { CircleDollarSign, Pen, Users } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      icon: <CircleDollarSign className="h-6 w-6" />,
      title: "Find the Perfect Space",
      description:
        "We help you find a short-term rental that fits your needs, with adequate foot traffic to make your business thrive.",
    },
    {
      icon: <Pen className="h-6 w-6" />,
      title: "Sign Up Once",
      description:
        "You only need to sign up once to access all shopping center in your area. We give you the flexibility to try out different markets.",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "We Handle the Minutia",
      description:
        "We take care of the details so you can focus on your business, from payment processing to contract management.",
    },
  ];

  return (
    <section>
      <div className="text-center">
        <h2>
          Why Choose <span className="text-blue-600">rentail</span>.space?
        </h2>
        <p>
          We help you find a short-term rental that fits your needs, in a
          shopping center near you, at reasonable price, and with adequate foot
          traffic to make your business thrive.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="card shadow-sm">
            <div className="card-body">
              <div className="card-title flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

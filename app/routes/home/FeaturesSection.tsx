export default function FeaturesSection() {
  const features = [
    {
      icon: (
        <path
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
        />
      ),
      title: "Find the Perfect Space",
      description:
        "We help you find a short-term rental that fits your needs, with adequate foot traffic to make your business thrive.",
    },
    {
      icon: (
        <path
          d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
        />
      ),
      title: "Sign Up Once",
      description:
        "You only need to sign up once to access all shopping center in your area. We give you the flexibility to try out different markets.",
    },
    {
      icon: (
        <path
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
        />
      ),
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
          We help you find a retail space for rent. Grow your business in a few
          easy steps.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="card shadow-sm">
            <div className="card-body">
              <div className="card-title flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <title>{feature.title}</title>
                  {feature.icon}
                </svg>
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

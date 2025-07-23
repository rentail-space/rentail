export default function HowItWorksSection({
  howItWorksId,
}: {
  howItWorksId: string;
}) {
  const steps = [
    {
      title: "Sign Up",
      description: "Create an account and verify your business identity.",
    },
    {
      title: "Find a Space",
      description:
        "Chat away to find the perfect space for your business needs.",
    },
    {
      title: "Book & Pay",
      description:
        "Schedule the lease period, confirm details, and pay securely.",
    },
    {
      title: "Show & Sell",
      description:
        "Show up at the space, set up your business, and start selling!",
    },
  ];

  return (
    <section id={howItWorksId}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Looking to open a pop-up retail space in a shopping center? We can
            help you find the perfect space for your business needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div className="text-center" key={step.title}>
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                {index + 1}
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

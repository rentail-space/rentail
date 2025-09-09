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
      <div className="mb-16 text-center">
        <h2>How It Works</h2>
        <p>
          Looking to open a pop-up retail space in a shopping center? We can
          help you find the perfect space for your business needs.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        {steps.map((step, index) => (
          <div className="text-center" key={step.title}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 font-bold text-2xl text-white">
              {index + 1}
            </div>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

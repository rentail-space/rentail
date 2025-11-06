const stats = [
  { number: "500+", label: "Retail Spaces" },
  { number: "1,200+", label: "Active Merchants" },
  { number: "50+", label: "Shopping Centers" },
  { number: "95%", label: "Satisfaction Rate" },
];

export default function AboutStats() {
  return (
    <section className="bg-blue-600 px-4 py-20">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="mb-2 font-bold text-4xl text-white md:text-5xl">
                {stat.number}
              </div>
              <div className="text-blue-100">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

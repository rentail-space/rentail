const stats = [
  { number: "500+", label: "Retail Spaces" },
  { number: "1,200+", label: "Active Merchants" },
  { number: "50+", label: "Shopping Centers" },
  { number: "95%", label: "Satisfaction Rate" },
];

export default function AboutStats() {
  return (
    <section className="bg-[hsl(47,100%,95%)] px-4 py-20">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[10px] border-2 border-black bg-white p-6 text-center shadow-[4px_4px_0px_0px_black]"
            >
              <div className="mb-2 font-bold text-4xl text-black md:text-5xl">
                {stat.number}
              </div>
              <div className="font-medium text-black">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

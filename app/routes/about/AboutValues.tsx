import { Heart, Users, Zap } from "lucide-react";

const values = [
  {
    icon: <Heart className="h-6 w-6" />,
    title: "Empowering Entrepreneurs",
    description:
      "We believe every small business deserves a chance to succeed. Our platform removes barriers and makes retail space accessible to all.",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Innovation First",
    description:
      "We use AI and modern technology to solve age-old problems in retail leasing, making it faster, easier, and more transparent.",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Community Driven",
    description:
      "We're building a marketplace that benefits everyone—merchants, property owners, and shoppers alike.",
  },
];

export default function AboutValues() {
  return (
    <section className="bg-[hsl(60,100%,99%)] px-4 py-20">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-bold text-4xl text-black leading-tight">
            Our Values
          </h2>
          <p className="mx-auto max-w-2xl font-medium text-black text-xl leading-relaxed">
            These principles guide everything we do at rentail.space
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {values.map((value) => (
            <div
              key={value.title}
              className="rounded-[10px] border-2 border-black bg-white p-8 shadow-[4px_4px_0px_0px_black]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[5px] border-2 border-black bg-[hsl(37,92%,65%)] text-black shadow-[2px_2px_0px_0px_black]">
                {value.icon}
              </div>
              <h3 className="mb-3 font-bold text-black text-xl">
                {value.title}
              </h3>
              <p className="font-medium text-black leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

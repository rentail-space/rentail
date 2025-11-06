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
    <section className="px-4 py-20">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-bold text-4xl text-gray-900">Our Values</h2>
          <p className="mx-auto max-w-2xl text-gray-600 text-xl">
            These principles guide everything we do at rentail.space
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {values.map((value) => (
            <div
              key={value.title}
              className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                {value.icon}
              </div>
              <h3 className="mb-3 font-bold text-gray-900 text-xl">
                {value.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

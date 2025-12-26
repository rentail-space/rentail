import { Heart, Users, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";

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
    <section className="mx-auto max-w-6xl bg-[hsl(60,100%,99%)] py-20">
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
          <Card
            key={value.title}
            className="rounded-md border-2 border-black bg-white p-8 shadow-[4px_4px_0px_0px_black]"
          >
            <CardHeader>
              <CardTitle>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-base border-2 border-black bg-[hsl(37,92%,65%)] text-black shadow-[2px_2px_0px_0px_black]">
                  {value.icon}
                </div>
                <h3 className="mb-3 font-bold text-black text-xl">
                  {value.title}
                </h3>
              </CardTitle>
            </CardHeader>
            <CardContent>{value.description}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

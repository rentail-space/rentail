import { Link } from "react-router";
import type { ImageObject } from "schema-dts";
import invariant from "tiny-invariant";
import schema from "../../data/schema.json";

export default function HeroSection({
  howItWorksId,
}: {
  howItWorksId: string;
}) {
  const heroImage = schema["@graph"].find(
    (item) => item["@type"] === "ImageObject",
  ) as ImageObject;
  invariant(heroImage, "Hero image not found");
  invariant(heroImage.contentUrl, "Hero image content URL not found");

  return (
    <section className="hero bg-gradient-to-r from-blue-50 to-indigo-50 py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 prose prose-lg">
            <h1>
              Find your <span className="text-blue-600">short-term rental</span>
            </h1>
            <p>
              We help you find a short-term rental that fits your needs, in a
              shopping center near you, at reasonable price, and with adequate
              foot traffic to make your business thrive.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/chat" className="btn btn-lg btn-primary">
                Get Started
              </Link>
              <Link to={`#${howItWorksId}`} className="btn btn-lg btn-outline">
                How It Works
              </Link>
            </div>
          </div>

          <div className="md:w-1/2 hero-content">
            <div className="relative">
              <div className="bg-white p-2 rounded-2xl shadow-xl">
                <img
                  alt={heroImage.caption?.toString()}
                  className="rounded-xl w-full h-auto"
                  height={heroImage.height?.toString() ?? "auto"}
                  src={new URL(heroImage.contentUrl.toString()).pathname}
                  width={heroImage.width?.toString() ?? "auto"}
                />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-blue-600 text-white px-4 py-2 rounded-lg">
                Rent a space for a few days, weeks, or months
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

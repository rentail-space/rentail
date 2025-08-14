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
        <div className="flex flex-col items-center md:flex-row">
          <div className="prose prose-lg mb-10 md:mb-0 md:w-1/2">
            <h1>
              Find your <span className="text-blue-600">short-term rental</span>
            </h1>
            <p>
              We help you find a short-term rental that fits your needs, in a
              shopping center near you, at reasonable price, and with adequate
              foot traffic to make your business thrive.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link to="/chat" className="btn btn-lg btn-primary">
                Get Started
              </Link>
              <Link to={`#${howItWorksId}`} className="btn btn-lg btn-outline">
                How It Works
              </Link>
            </div>
          </div>

          <div className="hero-content md:w-1/2">
            <div className="relative">
              <div className="rounded-2xl bg-white p-2 shadow-xl">
                <img
                  alt={heroImage.caption?.toString()}
                  className="h-auto w-full rounded-xl"
                  height={heroImage.height?.toString() ?? "auto"}
                  src={new URL(heroImage.contentUrl.toString()).pathname}
                  width={heroImage.width?.toString() ?? "auto"}
                />
              </div>
              <div className="-bottom-4 -left-4 absolute rounded-lg bg-blue-600 px-4 py-2 text-white">
                Rent a space for a few days, weeks, or months
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { invariant } from "es-toolkit";
import { Link } from "react-router";
import type { ImageObject } from "schema-dts";
import schema from "~/data/schema.json";

export default function HeroSection() {
  const heroImage = schema["@graph"].find(
    (item) => item["@type"] === "ImageObject",
  ) as ImageObject;
  invariant(heroImage, "Hero image not found");
  invariant(heroImage.contentUrl, "Hero image content URL not found");

  return (
    <section className="relative overflow-hidden bg-linear-to-br from-blue-50 via-white to-indigo-50 px-4 py-24 md:py-32">
      <div className="container relative z-10 mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left Column - Text Content */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6">
              <h1 className="font-bold text-5xl text-gray-900 leading-tight tracking-tight md:text-6xl">
                Find your{" "}
                <span className="text-blue-600">short-term retail space</span>{" "}
                with ease
              </h1>
              <p className="text-gray-600 text-xl leading-relaxed md:text-2xl">
                An AI-powered platform for micro-merchants that matches you with
                your ideal retail space and handles all the details. Stop
                scrolling Craigslist—start selling.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                to="/chat"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-4 font-semibold text-lg text-white transition-all hover:bg-blue-700 hover:shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="relative">
            <div className="relative rounded-2xl bg-white p-3 shadow-2xl">
              <img
                alt={heroImage.caption?.toString()}
                className="h-auto w-full rounded-xl"
                height={heroImage.height?.toString() ?? "auto"}
                src={new URL(heroImage.contentUrl.toString()).pathname}
                width={heroImage.width?.toString() ?? "auto"}
              />
            </div>
            <div className="-bottom-6 -left-6 absolute z-20 rounded-xl bg-blue-600 px-6 py-4 text-white shadow-xl">
              <p className="font-semibold text-sm">
                🎉 Rent for days, weeks, or months
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

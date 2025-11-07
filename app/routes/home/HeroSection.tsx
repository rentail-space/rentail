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
    <section className="hero bg-base-200 bg-linear-to-br from-blue-50 via-white to-indigo-50 p-10">
      <div className="hero-content flex-col lg:flex-row-reverse">
        {/* Right Column - Image */}
        <div className="flex flex-col gap-4">
          <div className="min-w-[400px] rounded-2xl bg-white p-3 shadow-2xl">
            <img
              alt={heroImage.caption?.toString()}
              className="h-auto w-full rounded-xl"
              height={heroImage.height?.toString() ?? "auto"}
              src={new URL(heroImage.contentUrl.toString()).pathname}
              width={heroImage.width?.toString() ?? "auto"}
            />
          </div>
          <div className="px-6 py-4 text-center font-semibold text-lg">
            🎉 Rent for days, weeks, or months
          </div>
        </div>

        {/* Left Column - Text Content */}
        <div className="flex flex-col gap-8">
          <h1 className="font-bold text-5xl text-gray-900 leading-tight tracking-tight md:text-6xl">
            <span>Find your</span>
            <span className="mx-4 text-blue-600">short-term retail space</span>
            <span>with ease</span>
          </h1>

          <p className="text-gray-600 text-xl leading-relaxed md:text-2xl">
            An AI-powered platform for micro-merchants that matches you with
            your ideal retail space and handles all the details. Stop scrolling
            Craigslist—start selling.
          </p>

          <Link
            to="/chat"
            className="my-4 inline w-fit rounded-xl bg-blue-600 px-8 py-4 font-semibold text-lg text-white transition-all hover:bg-blue-700 hover:shadow-lg"
          >
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
}

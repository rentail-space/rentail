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
    <section className="bg-[hsl(60,100%,99%)] p-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 lg:flex-row-reverse lg:items-center">
        {/* Right Column - Image */}
        <div className="flex flex-1 flex-col gap-4">
          <div className="overflow-hidden rounded-[10px] border-2 border-black bg-white p-4 shadow-[8px_8px_0px_0px_black]">
            <img
              alt={heroImage.caption?.toString()}
              className="h-auto w-full rounded-[5px]"
              height={heroImage.height?.toString() ?? "auto"}
              src={new URL(heroImage.contentUrl.toString()).pathname}
              width={heroImage.width?.toString() ?? "auto"}
            />
          </div>
          <div className="rounded-[10px] border-2 border-black bg-[hsl(47,100%,95%)] px-6 py-4 text-center font-bold text-black text-lg shadow-[4px_4px_0px_0px_black]">
            🎉 Rent for days, weeks, or months
          </div>
        </div>

        {/* Left Column - Text Content */}
        <div className="flex flex-1 flex-col gap-8">
          <h1 className="font-bold text-5xl text-black leading-tight tracking-tight md:text-6xl">
            <span>Find your</span>
            <span className="mx-4 text-[hsl(37,92%,65%)]">
              short-term retail space
            </span>
            <span>with ease</span>
          </h1>

          <p className="font-medium text-black text-xl leading-relaxed md:text-2xl">
            An AI-powered platform for micro-merchants that matches you with
            your ideal retail space and handles all the details. Stop scrolling
            Craigslist—start selling.
          </p>

          <Link
            to="/chat"
            className="my-4 inline w-fit transform rounded-[10px] border-2 border-black bg-[hsl(37,92%,65%)] px-8 py-4 font-bold text-black text-lg shadow-[6px_6px_0px_0px_black] no-underline transition-all duration-100 hover:shadow-[8px_8px_0px_0px_black] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-[4px_4px_0px_0px_black] active:translate-x-[2px] active:translate-y-[2px]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
}

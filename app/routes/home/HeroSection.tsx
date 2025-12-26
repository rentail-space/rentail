import { ActiveLink } from "~/components/ui/ActiveLink";
import { cn } from "~/lib/utils";

export default function HeroSection() {
  return (
    <section className="bg-[hsl(60,100%,99%)] p-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 lg:flex-row-reverse lg:items-center">
        {/* Right Column - Image */}
        <div
          className={cn(
            "flex flex-1 flex-col gap-4 bg-conic",
            "-rotate-3 duration-200 hover:rotate-2",
          )}
        >
          <div className="overflow-hidden rounded-md border-2 border-black bg-white p-4 shadow-[8px_8px_0px_0px_black]">
            <img
              alt="Two people sharing and exchanging items"
              className="h-auto w-full rounded-sm"
              height="533"
              src="/images/hero-image.jpg"
              width="800"
            />
          </div>
          <div className="rounded-md border-2 border-black bg-[hsl(47,100%,95%)] px-6 py-4 text-center font-bold text-black text-lg shadow-[4px_4px_0px_0px_black]">
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

          <ActiveLink
            to="/chat"
            variant="button"
            bg="yellow"
            size="xl"
            className="my-4 w-fit"
          >
            Get Started
          </ActiveLink>
        </div>
      </div>
    </section>
  );
}

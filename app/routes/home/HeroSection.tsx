import { twMerge } from "tailwind-merge";
import { ActiveLink } from "~/components/ui/ActiveLink";

export default function HeroSection() {
  return (
    <section className="bg-[hsl(60,100%,99%)] p-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 lg:flex-row-reverse lg:items-center">
        {/* Right Column - Image */}
        <div
          className={twMerge(
            "flex flex-1 flex-col gap-4 bg-conic",
            "rotate-2 duration-200 hover:-rotate-3",
            "*:overflow-hidden *:rounded-md *:border-2 *:border-black *:shadow-[6px_6px_0px_0px_black]",
          )}
        >
          <div className="h-auto w-full bg-white p-0">
            <img
              alt="Two people sharing and exchanging items"
              src="/images/home/intro.png"
              width="800"
            />
          </div>
          <div className="bg-[hsl(47,100%,95%)] px-6 py-4 text-center font-bold text-black text-lg">
            🎉 Rent for days, weeks, or months
          </div>
        </div>

        {/* Left Column - Text Content */}
        <div className="flex flex-1 flex-col gap-8">
          <h1 className="font-bold text-6xl text-black leading-tight tracking-tight md:text-6xl">
            <span>Find </span>
            <span className="text-[hsl(37,92%,65%)]">Your Next Mall Space</span>
            <span> in Under 2 Minutes</span>
          </h1>

          <p className="font-medium text-black text-xl leading-relaxed md:text-2xl">
            Find short-term retail spaces in shopping centers—without the broker
            meetings or endless phone calls. Built for small businesses and
            seasonal sellers. Just instant matches with spaces ready for your
            products.
          </p>

          <ActiveLink
            to="/chat"
            variant="button"
            bg="yellow"
            size="xl"
            className="my-4 w-fit"
          >
            Find My Match
          </ActiveLink>
        </div>
      </div>
    </section>
  );
}

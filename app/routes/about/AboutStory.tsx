import { Lightbulb } from "lucide-react";

export default function AboutStory() {
  return (
    <section className="mx-auto max-w-4xl bg-[hsl(60,100%,99%)] py-20">
      <div className="flex flex-col gap-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-base border-2 border-black bg-[hsl(37,92%,65%)] text-black shadow-[2px_2px_0px_0px_black]">
            <Lightbulb className="h-6 w-6" />
          </div>
          <div>
            <h2 className="mb-4 font-bold text-3xl text-black leading-tight">
              Our Story
            </h2>
            <div className="flex flex-col gap-4 font-medium text-black text-lg leading-relaxed">
              <p>
                Rentail.space started with a simple observation: finding
                short-term retail space shouldn't be this hard. Too many
                talented entrepreneurs with great products never get a shot at
                physical retail because the traditional leasing process is
                complicated, expensive, and built for insiders.
              </p>
              <p>
                In 2025, we decided to fix that. Built an AI-powered platform
                that connects micro-merchants with shopping centers looking to
                fill specialty leasing opportunities. No more cold calling
                property managers. No more complex negotiations. No more
                wondering if you're getting screwed.
              </p>
              <p>
                We're just getting started. Our vision: make every shopping
                center in America accessible to entrepreneurs of all sizes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

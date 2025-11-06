import { Lightbulb } from "lucide-react";

export default function AboutStory() {
  return (
    <section className="px-4 py-20">
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col gap-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Lightbulb className="h-6 w-6" />
            </div>
            <div>
              <h2 className="mb-4 font-bold text-3xl text-gray-900">
                Our Story
              </h2>
              <div className="flex flex-col gap-4 text-gray-700 text-lg leading-relaxed">
                <p>
                  Rentail.space was born from a simple observation: finding
                  short-term retail space shouldn't be this hard. Too many
                  talented entrepreneurs with great products never get the
                  chance to test their ideas in physical retail because the
                  traditional leasing process is complicated, expensive, and
                  exclusive.
                </p>
                <p>
                  In 2025, we set out to change that. We built an AI-powered
                  platform that connects micro-merchants with shopping centers
                  looking to fill specialty leasing opportunities. No more cold
                  calling property managers, no more complex negotiations, no
                  more wondering if you're getting a fair deal.
                </p>
                <p>
                  And we're just getting started. Our vision is to make every
                  shopping center in America accessible to entrepreneurs of all
                  sizes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

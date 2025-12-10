import { Target } from "lucide-react";

export default function AboutMission() {
  return (
    <section className="bg-[hsl(60,100%,99%)] px-4 py-20">
      <div className="container mx-auto max-w-4xl">
        <div className="rounded-md border-2 border-black bg-white p-8 shadow-[6px_6px_0px_0px_black] md:p-12">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[5px] border-2 border-black bg-[hsl(37,92%,65%)] text-black shadow-[2px_2px_0px_0px_black]">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <h2 className="mb-4 font-bold text-3xl text-black leading-tight">
                Our Mission
              </h2>
              <p className="font-medium text-black text-lg leading-relaxed">
                To empower 1 million entrepreneurs to start and grow their
                retail businesses by making short-term retail space as easy to
                find and book as a hotel room. We believe physical retail should
                be accessible to everyone, not just those with deep pockets and
                industry connections.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { Target } from "lucide-react";

export default function AboutMission() {
  return (
    <section className="px-4 py-20">
      <div className="container mx-auto max-w-4xl">
        <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-8 md:p-12">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <h2 className="mb-4 font-bold text-3xl text-gray-900">
                Our Mission
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed">
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

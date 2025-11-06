import { Lightbulb } from "lucide-react";

export default function SpecialtyLeasing() {
  return (
    <section className="px-4 py-20">
      <div className="container mx-auto max-w-4xl">
        <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-8 md:p-12">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Lightbulb className="h-6 w-6" />
            </div>
            <div className="flex flex-col gap-4">
              <h2 className="font-bold text-3xl text-gray-900">
                What is Specialty Leasing?
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Specialty leasing refers to short-term retail space in malls,
                shopping centers, and other retail centers. It includes flexible
                options like RMUs (Retail Merchandising Units), retail carts,
                booth rentals, kiosk spaces, and pop-up shops. These options
                allow businesses to test new concepts while adding variety to
                the consumer experience—all without long-term commitments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

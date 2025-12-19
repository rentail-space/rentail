import { Lightbulb } from "lucide-react";
import { cn } from "~/lib/utils";

export default function SpecialtyLeasing() {
  return (
    <section className="bg-[hsl(60,100%,99%)] px-4 py-20">
      <div className="container mx-auto max-w-4xl">
        <div
          className={cn(
            "rounded-md border-2 border-black bg-white p-8 shadow-[6px_6px_0px_0px_black] duration-200 hover:-rotate-1 md:p-12",
            "rotate-1 duration-200 hover:-rotate-1",
          )}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border-2 border-black bg-[hsl(37,92%,65%)] text-black shadow-[2px_2px_0px_0px_black]">
              <Lightbulb className="h-6 w-6" />
            </div>
            <div className="flex flex-col gap-4">
              <h2 className="font-bold text-3xl text-black leading-tight">
                What is Specialty Leasing?
              </h2>
              <p className="font-medium text-black text-lg leading-relaxed">
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

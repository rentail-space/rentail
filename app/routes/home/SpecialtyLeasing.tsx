import { Lightbulb } from "lucide-react";
import { ActiveLink } from "~/components/ui/ActiveLink";
import { cn } from "~/lib/utils";

export default function SpecialtyLeasing() {
  return (
    <section className="flex flex-col items-center gap-8 bg-[hsl(47,100%,95%)] px-5 py-20">
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
                Specialty leasing = short-term retail space in malls and
                shopping centers. Think RMUs (Retail Merchandising Units),
                retail carts, kiosks, and pop-up shops. Test new concepts, add
                variety to the shopping experience—all without signing your life
                away for five years.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ActiveLink
        to="/chat"
        variant="button"
        bg="yellow"
        size="xl"
        className="my-4 w-fit"
      >
        Find a Space
      </ActiveLink>
    </section>
  );
}

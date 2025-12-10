import type { PropertyGetPayload } from "prisma/generated/models";
import { Activity, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { cn } from "~/lib/utils";

/**
 * A list of centers that are nearby the user.
 *
 * @param centers - The centers that are nearby the user.
 * @returns A list of centers that are nearby the user.
 */
export default function Centers({
  centers,
  location,
}: {
  centers: PropertyGetPayload<{ include: { spaces: true } }>[];
  location: string;
}) {
  return (
    <div className="sticky top-0 my-4 hidden h-fit w-1/4 lg:block">
      <div className="rounded-md border-2 border-black bg-white p-6 shadow-[6px_6px_0px_0px_black]">
        {centers.length > 0 ? (
          <AvailableCenters centers={centers} />
        ) : (
          <NoAvailableCenters location={location} />
        )}
      </div>
    </div>
  );
}

function NoAvailableCenters({ location }: { location?: string }) {
  return (
    <>
      <div className="mb-2 font-bold text-black text-lg">
        No available centers
      </div>
      {location && (
        <p className="font-medium text-black text-sm">
          We're looking in {location}
        </p>
      )}
    </>
  );
}

function AvailableCenters({
  centers,
}: {
  centers: PropertyGetPayload<{ include: { spaces: true } }>[];
}) {
  const [hoveredCenter, setHoveredCenter] = useState<string | null>(null);

  return (
    <>
      <div className="mb-3 font-bold text-black text-lg">
        Available Centers ({centers.length})
      </div>
      <div className="flex flex-col gap-2">
        {centers
          // Sort by number of available spaces, then by name
          .sort((a, b) =>
            a.spaces.length === b.spaces.length
              ? a.name.localeCompare(b.name)
              : b.spaces.length - a.spaces.length,
          )
          .map((center) => (
            <LinkToCenter
              hoveredCenter={hoveredCenter}
              key={center.id}
              center={center}
              setHoveredCenter={setHoveredCenter}
            />
          ))}
      </div>
    </>
  );
}

function LinkToCenter({
  hoveredCenter,
  center,
  setHoveredCenter,
}: {
  hoveredCenter: string | null;
  center: PropertyGetPayload<{ include: { spaces: true } }>;
  setHoveredCenter: (centerId: string | null) => void;
}) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: container for hover card positioning
    <div
      className="relative"
      onMouseEnter={() => setHoveredCenter(center.id)}
      onMouseLeave={() => setHoveredCenter(null)}
    >
      <Link
        className="flex flex-row items-center gap-2 rounded-[5px] border-2 border-black bg-white px-3 py-2 font-medium text-black shadow-[2px_2px_0px_0px_black] transition-all duration-100 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_black]"
        target="_blank"
        to={`/center/${center.id}`}
      >
        <img
          alt="Shopping mall"
          className="h-5 w-5 shrink-0 rounded-sm border border-black object-contain"
          src={center.logoURL || "/images/shopping-mall.png"}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-bold text-black text-sm">
            {center.name}
          </span>
          <span className="font-medium text-black/70 text-xs">
            {center.spaces.length}{" "}
            {center.spaces.length === 1 ? "space" : "spaces"}
          </span>
        </div>
      </Link>

      <HoverCard
        mode={hoveredCenter === center.id ? "visible" : "hidden"}
        center={center}
      />
    </div>
  );
}

function HoverCard({
  mode,
  center,
}: {
  mode: "hidden" | "visible";
  center: PropertyGetPayload<{ include: { spaces: true } }>;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [topOffset, setTopOffset] = useState(0);

  useEffect(() => {
    if (mode !== "visible" || !cardRef.current) return;

    const updatePosition = () => {
      requestAnimationFrame(() => {
        const card = cardRef.current;
        if (!card) return;

        // Find the input form container (the div wrapping the form)
        const inputFormContainer = Array.from(
          document.querySelectorAll("div"),
        ).find(
          (el) =>
            el.querySelector("form") &&
            (el.classList.contains("bg-gray-50") ||
              el.classList.contains("bg-[hsl(60,100%,99%)]")),
        );
        const header = document.querySelector("header");

        if (!inputFormContainer || !header) return;

        const inputRect = inputFormContainer.getBoundingClientRect();
        const headerRect = header.getBoundingClientRect();
        const parentRect = card.parentElement?.getBoundingClientRect();

        if (!parentRect) return;

        // Measure actual card height
        const cardHeight = card.offsetHeight;

        // Natural top position (aligned with list item top)
        const naturalTop = 0;

        // Calculate where card bottom would be if at natural top (in viewport coordinates)
        const naturalCardBottom = parentRect.top + naturalTop + cardHeight;

        // Maximum allowed bottom (10px above input field)
        const maxBottom = inputRect.top - 10;

        // Minimum allowed top (below header, in parent-relative coordinates)
        const minTop = headerRect.bottom - parentRect.top;

        let adjustedTop = naturalTop;

        // If card would extend below input field, adjust upward
        if (naturalCardBottom > maxBottom) {
          // Calculate new top so bottom is 10px above input
          adjustedTop = maxBottom - cardHeight - parentRect.top;
        }

        // Ensure card top is below header
        if (adjustedTop < minTop) {
          adjustedTop = minTop;
        }

        setTopOffset(adjustedTop);
      });
    };

    // Update position immediately and on resize/scroll
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [mode]);

  return (
    <Activity mode={mode}>
      <Link target="_blank" to={`/center/${center.id}`}>
        <div
          ref={cardRef}
          className={cn(
            "absolute right-full z-50 my-24 mr-10",
            "w-96 max-w-[min(20rem,calc(100vw-2rem))] overflow-hidden",
            "rounded-md border-2 border-black bg-white shadow-[6px_6px_0px_0px_black]",
          )}
          style={{ top: `${topOffset}px` }}
        >
          <div className="p-4">
            <p className="mb-2 font-bold text-black text-lg">{center.name}</p>
            <p className="line-clamp-5 font-medium text-black text-sm">
              {center.description.split("\n")[0]}
            </p>
          </div>

          <figure
            className="border-black border-y-2"
            style={{
              background:
                "repeating-linear-gradient(135deg, #e5e7eb 0 24px, #fff 24px 48px)",
            }}
          >
            <img
              alt={center.name}
              onError={(e) => {
                e.currentTarget.classList.add("hidden");
              }}
              onLoad={(e) => {
                e.currentTarget.classList.remove("opacity-0");
              }}
              src={center.imageURLs[0]}
              className="opacity-0"
            />
          </figure>

          <div className="p-4 font-bold text-black text-sm">
            {center.spaces.length > 1
              ? `${center.spaces.length} available spaces`
              : center.spaces.length === 1
                ? "1 available space"
                : "All spaces are leased"}
          </div>
        </div>
      </Link>
    </Activity>
  );
}

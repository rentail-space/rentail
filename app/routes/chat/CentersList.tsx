import type { PropertyGetPayload } from "prisma/generated/models";
import { Activity, useEffect, useRef, useState } from "react";
import { Link } from "react-router";

/**
 * A list of centers that are nearby the user.
 *
 * @param centers - The centers that are nearby the user.
 * @returns A list of centers that are nearby the user.
 */
export default function CentersList({
  centers,
}: {
  centers: PropertyGetPayload<{ include: { spaces: true } }>[];
}) {
  const [hoveredCenter, setHoveredCenter] = useState<string | null>(null);

  if (centers.length === 0) return null;

  return (
    <div className="sticky top-4 h-fit">
      <div className="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-4 shadow-lg">
        <h3 className="mb-2 font-bold text-base-content text-sm">
          Available Centers ({centers.length})
        </h3>
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
      </div>
    </div>
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
        className="flex flex-row items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-base-200"
        target="_blank"
        to={`/center/${center.id}`}
      >
        <img
          alt="Shopping mall"
          className="h-4 w-4 shrink-0"
          src={center.logoURL || "/images/shopping-mall.png"}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium text-base-content text-sm">
            {center.name}
          </span>
          <span className="text-base-content/60 text-xs">
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
            el.querySelector("form") && el.classList.contains("bg-gray-50"),
        );
        const header = document.querySelector("header.navbar");

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
    <Activity name="HoverCard" mode={mode}>
      <div
        ref={cardRef}
        className="absolute right-full z-50 mr-[38px] w-80 max-w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-base-300 bg-base-100 p-4 shadow-xl"
        style={{ top: `${topOffset}px` }}
      >
        <h3 className="mb-2 font-bold text-lg">{center.name}</h3>
        <p className="mb-3 line-clamp-5 text-base-content/70 text-sm">
          {center.description}
        </p>

        <div
          style={{
            background:
              "repeating-linear-gradient(135deg, #e5e7eb 0 24px, #fff 24px 48px)",
          }}
          className="relative flex h-[160px] w-full items-center justify-center overflow-hidden rounded-lg border-2 border-base-300"
        >
          <img
            alt={center.name}
            className="absolute inset-0 h-40 w-full rounded-lg object-cover opacity-0 transition-opacity duration-300"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            onLoad={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
            src={center.imageURLs[0]}
          />
        </div>

        <div className="mt-4 font-bold text-base-content/70 text-lg">
          {center.spaces.length > 1
            ? `${center.spaces.length} available spaces`
            : center.spaces.length === 1
              ? "1 available space"
              : "All spaces are leased"}
        </div>
      </div>
    </Activity>
  );
}

import { sortBy } from "es-toolkit";
import type { PropertyGetPayload } from "prisma/generated/models";
import { Activity, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import LoadingImage from "~/components/ui/LoadingImage";
import { trackEvent } from "~/lib/analytics";
import { cn } from "~/lib/utils";

/**
 * A list of centers that are nearby the user.
 *
 * @param centers - The centers that are nearby the user.
 * @returns A list of centers that are nearby the user.
 */
export default function Centers({
  centers,
}: {
  centers: PropertyGetPayload<{ include: { spaces: true } }>[];
}) {
  const [centerShown, setCenterShown] = useState<string | null>(null);

  return (
    <Card className="fixed right-0 bottom-24 mr-4 hidden h-fit bg-white lg:block lg:w-1/4">
      <CardHeader>
        <CardTitle className="font-bold text-2xl">Shopping Centers</CardTitle>
      </CardHeader>
      <CardContent className="mt-4 space-y-4">
        {centers.length === 0 ? (
          <p>I can't find any shopping centers near you.</p>
        ) : (
          sortCenters(centers, 8).map((center) => (
            <LinkToCenter
              center={center}
              centerShown={centerShown}
              key={center.id}
              setCenterShown={setCenterShown}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function LinkToCenter({
  centerShown,
  center,
  setCenterShown,
}: {
  centerShown: string | null;
  center: PropertyGetPayload<{ include: { spaces: true } }>;
  setCenterShown: (centerId: string | null) => void;
}) {
  return (
    <>
      <Link
        className="block"
        onClick={() => trackEvent("view_center", { category: "chat" })}
        onMouseEnter={() => setCenterShown(center.id)}
        onMouseLeave={() => setCenterShown(null)}
        target="_blank"
        to={`/center/${center.id}`}
      >
        <Card className="p-2!">
          <CardContent className="flex flex-row items-center gap-2 p-0">
            <img
              alt="Shopping mall"
              className="h-5 w-5 shrink-0 rounded-sm border border-black object-contain"
              src={center.logoURL || "/images/shopping-mall.png"}
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="truncate font-bold text-black text-sm">
                {center.name}
              </div>
              {center.spaces.length > 0 && (
                <div className="font-medium text-black/70 text-xs">
                  {center.spaces.length} available{" "}
                  {center.spaces.length === 1 ? "space" : "spaces"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>

      <HoverCard
        center={center}
        centerShown={centerShown}
        setCenterShown={setCenterShown}
      />
    </>
  );
}

function HoverCard({
  center,
  centerShown,
  setCenterShown,
}: {
  center: PropertyGetPayload<{ include: { spaces: true } }>;
  centerShown: string | null;
  setCenterShown: (centerId: string | null) => void;
}) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [topOffset, setTopOffset] = useState(0);

  useLayoutEffect(() => {
    if (!centerShown || !cardRef.current) return;

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
        if (adjustedTop < minTop) adjustedTop = minTop;

        setTopOffset(adjustedTop);
        requestAnimationFrame(() => {
          card.classList.remove("hidden");
        });
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
  }, [centerShown]);

  return (
    <Activity mode={centerShown === center.id ? "visible" : "hidden"}>
      <Link
        className="hidden"
        onMouseEnter={() => setCenterShown(center.id)}
        onMouseLeave={() => setCenterShown(null)}
        ref={cardRef}
        target="_blank"
        to={`/center/${center.id}`}
      >
        <div
          className={cn(
            "absolute right-full z-50 my-24 mr-5",
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
          <LoadingImage
            alt={center.name}
            figureClassName="border-y-2 border-black"
            maxHeight={300}
            src={center.imageURLs[0]}
          />
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

/**
 * Sort centers so we show the most relevant centers first:
 * - Most available spaces
 * - Highest tier
 * - Highest rating
 * - Alphabetically
 *
 * We need limit so can pick top N based on criteria (available spaces, rating,
 * etc) and then sort alphabetically.
 *
 * @param centers - The centers to sort.
 * @param limit - The number of centers to return.
 * @returns The sorted centers.
 */
function sortCenters(
  centers: PropertyGetPayload<{ include: { spaces: true } }>[],
  limit: number,
) {
  const sorted = sortBy(centers, [
    (center) => center.spaces.length,
    (center) => center.tier,
    (center) => center.rating ?? 0,
  ])
    .reverse()
    .slice(0, limit);
  return sortBy(sorted, ["name"]);
}

import type { PropertyGetPayload } from "prisma/generated/models";
import { Activity, useState } from "react";
import { Link } from "react-router";

/**
 * A list of properties that are nearby the user.
 *
 * @param properties - The properties that are nearby the user.
 * @returns A list of properties that are nearby the user.
 */
export default function CentersList({
  centers,
}: {
  centers: PropertyGetPayload<{ include: { spaces: true } }>[];
}) {
  const [hoveredCenter, setHoveredCenter] = useState<string | null>(null);

  return (
    <div className="mx-auto hidden min-h-16 max-w-full overflow-x-auto md:block">
      <div className="flex w-max flex-row flex-nowrap gap-4">
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
      onMouseEnter={() => setHoveredCenter(center.id)}
      onMouseLeave={() => setHoveredCenter(null)}
    >
      <Link
        className="flex flex-row items-center gap-2 rounded-lg px-4 py-2 hover:bg-base-200"
        target="_blank"
        to={`/center/${center.id}`}
      >
        <img
          alt="Shopping mall"
          className="h-4 w-4"
          src={center.logoURL || "/images/shopping-mall.png"}
        />
        <span className="max-w-48 truncate text-base-content/70 text-sm">
          {center.name}
        </span>
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
  return (
    <Activity name="HoverCard" mode={mode}>
      <div className="absolute top-4 right-4 z-50 mb-2 w-80 rounded-lg border border-base-300 bg-base-100 p-4 shadow-xl">
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

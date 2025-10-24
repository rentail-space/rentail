import type { PropertyGetPayload } from "prisma/generated/models";
import { Activity, useState } from "react";
import { Link } from "react-router";

export default function PropertyList({
  properties,
}: {
  properties: PropertyGetPayload<{ include: { spaces: true } }>[];
}) {
  const [hoveredProperty, setHoveredProperty] = useState<string | null>(null);

  return (
    <div className="mx-auto flex max-w-xl flex-wrap gap-4">
      {properties.map((property) => (
        <PropertyLink
          hoveredProperty={hoveredProperty}
          key={property.id}
          property={property}
          setHoveredProperty={setHoveredProperty}
        />
      ))}
    </div>
  );
}

function PropertyLink({
  hoveredProperty,
  property,
  setHoveredProperty,
}: {
  hoveredProperty: string | null;
  property: PropertyGetPayload<{ include: { spaces: true } }>;
  setHoveredProperty: (propertyId: string | null) => void;
}) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: container for hover card positioning
    <div
      className="relative"
      onMouseEnter={() => setHoveredProperty(property.id)}
      onMouseLeave={() => setHoveredProperty(null)}
    >
      <Link
        className="flex flex-row items-center gap-2 rounded-lg px-4 py-2 hover:bg-base-200"
        target="_blank"
        to={`/property/${property.slug}`}
      >
        <img
          alt="Shopping mall"
          className="h-4 w-4"
          src="/images/shopping-mall.png"
        />
        <span className="max-w-[12rem] truncate text-base-content/70 text-sm">
          {property.name}
        </span>
      </Link>

      <HoverCard
        mode={hoveredProperty === property.id ? "visible" : "hidden"}
        property={property}
      />
    </div>
  );
}

function HoverCard({
  mode,
  property,
}: {
  mode: "hidden" | "visible";
  property: PropertyGetPayload<{ include: { spaces: true } }>;
}) {
  return (
    <Activity name="HoverCard" mode={mode}>
      <div className="absolute bottom-full left-0 z-50 mb-2 w-80 rounded-lg border border-base-300 bg-base-100 p-4 shadow-xl">
        <h3 className="mb-2 font-bold text-lg">{property.name}</h3>
        <p className="mb-3 line-clamp-5 text-base-content/70 text-sm">
          {property.description}
        </p>

        <div
          style={{
            background:
              "repeating-linear-gradient(135deg, #e5e7eb 0 24px, #fff 24px 48px)",
          }}
          className="relative flex h-[160px] w-full items-center justify-center overflow-hidden rounded-lg border-2 border-base-300"
        >
          <img
            alt={property.name}
            className="absolute inset-0 h-40 w-full rounded-lg object-cover opacity-0 transition-opacity duration-300"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            onLoad={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
            src={property.imageURLs[0]}
          />
        </div>
      </div>
    </Activity>
  );
}

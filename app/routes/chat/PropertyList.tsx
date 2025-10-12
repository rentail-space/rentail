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
    <div className="flex flex-wrap gap-4 mx-auto max-w-xl">
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
        className="flex flex-row gap-2 items-center hover:bg-base-200 rounded-lg px-4 py-2"
        target="_blank"
        to={`/property/${property.slug}`}
      >
        <img alt="Shopping mall" className="w-4 h-4" src="/shopping-mall.png" />
        <span className="text-sm text-base-content/70 truncate max-w-[12rem]">
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
      <div className="absolute bottom-full left-0 mb-2 w-80 bg-base-100 border border-base-300 rounded-lg shadow-xl p-4 z-50">
        <h3 className="font-bold text-lg mb-2">{property.name}</h3>
        <p className="text-sm text-base-content/70 mb-3 line-clamp-5">
          {property.description}
        </p>

        <div
          style={{
            background:
              "repeating-linear-gradient(135deg, #e5e7eb 0 24px, #fff 24px 48px)",
          }}
          className="w-full relative overflow-hidden justify-center flex border-2 border-base-300 items-center rounded-lg h-[160px]"
        >
          <img
            alt={property.name}
            className="w-full h-40 rounded-lg absolute inset-0 object-cover opacity-0 transition-opacity duration-300"
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

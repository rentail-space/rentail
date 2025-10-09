import type { PropertyGetPayload } from "prisma/generated/models";
import { Activity, useState } from "react";
import { Link } from "react-router";
import truncateWords from "~/lib/truncateWords";

export default function Properties({
  properties,
}: {
  properties: PropertyGetPayload<{ include: { spaces: true } }>[];
}) {
  const [hoveredProperty, setHoveredProperty] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap gap-4 mx-auto max-w-xl">
      {properties.map((property) => (
        <Link
          key={property.id}
          className="relative flex flex-row gap-2 items-center hover:bg-base-200 rounded-lg px-4 py-2"
          onMouseEnter={() => setHoveredProperty(property.id)}
          onMouseLeave={() => setHoveredProperty(null)}
          to={`/property/${property.slug}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="/shopping-mall.png"
            alt="Shopping mall"
            className="w-4 h-4"
          />
          <span className="text-sm text-base-content/70">{property.name}</span>

          <HoverCard
            property={property}
            key={property.id}
            mode={hoveredProperty === property.id ? "visible" : "hidden"}
          />
        </Link>
      ))}
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
        <p className="text-sm text-base-content/70 mb-3">
          {truncateWords(property.description, 30)}
        </p>
        <img
          src={property.imageURLs[0]}
          alt={property.name}
          className="w-full h-40 rounded-lg"
        />
      </div>
    </Activity>
  );
}

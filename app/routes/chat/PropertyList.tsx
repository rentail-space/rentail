import type { UIMessage } from "ai";
import type { PropertyGetPayload } from "prisma/generated/models";
import { Activity, useEffect, useState } from "react";
import { Link } from "react-router";

/**
 * A list of properties that are nearby the user.
 *
 * @param chatId - The ID of the chat.
 * @param lastAssistantMessage - The last message from the assistant
 * @returns A list of properties that are nearby the user.
 */
export default function PropertyList({
  chatId,
  lastAssistantMessage,
}: {
  chatId: string;
  lastAssistantMessage?: UIMessage;
}) {
  const [properties, setProperties] = useState<
    PropertyGetPayload<{ include: { spaces: true } }>[]
  >([]);
  const [hoveredProperty, setHoveredProperty] = useState<string | null>(null);

  useEffect(() => {
    if (!lastAssistantMessage?.id) return;
    fetch(`/api/chat/${chatId}/properties`)
      .then((response) => response.json())
      .then((data) => setProperties(data.properties));
  }, [chatId, lastAssistantMessage?.id]);

  return (
    <div className="mx-auto hidden min-h-16 max-w-full overflow-x-auto md:block">
      <div className="flex w-max flex-row flex-nowrap gap-4">
        {properties
          // Sort by number of available spaces, then by name
          .sort((a, b) =>
            a.spaces.length === b.spaces.length
              ? a.name.localeCompare(b.name)
              : b.spaces.length - a.spaces.length,
          )
          .map((property) => (
            <PropertyLink
              hoveredProperty={hoveredProperty}
              key={property.id}
              property={property}
              setHoveredProperty={setHoveredProperty}
            />
          ))}
      </div>
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
      onMouseEnter={() => setHoveredProperty(property.id)}
      onMouseLeave={() => setHoveredProperty(null)}
    >
      <Link
        className="flex flex-row items-center gap-2 rounded-lg px-4 py-2 hover:bg-base-200"
        target="_blank"
        to={`/property/${property.id}`}
      >
        <img
          alt="Shopping mall"
          className="h-4 w-4"
          src={property.logoURL || "/images/shopping-mall.png"}
        />
        <span className="max-w-48 truncate text-base-content/70 text-sm">
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
      <div className="absolute top-4 right-4 z-50 mb-2 w-80 rounded-lg border border-base-300 bg-base-100 p-4 shadow-xl">
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

        <div className="mt-4 font-bold text-base-content/70 text-lg">
          {property.spaces.length > 1
            ? `${property.spaces.length} available spaces`
            : property.spaces.length === 1
              ? "1 available space"
              : "All spaces leased"}
        </div>
      </div>
    </Activity>
  );
}

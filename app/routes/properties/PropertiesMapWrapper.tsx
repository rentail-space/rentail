import type { PropertyGetPayload } from "prisma/generated/models";
import { useEffect, useState } from "react";

/**
 * Wrapper component that dynamically loads the Leaflet map only on the client.
 * This prevents "window is not defined" errors during server-side rendering.
 */
export default function PropertiesMapWrapper({
  properties,
  latitude,
  longitude,
}: {
  properties: PropertyGetPayload<{ include: { spaces: true } }>[];
  latitude: number;
  longitude: number;
}) {
  const [PropertiesMap, setPropertiesMap] = useState<
    typeof import("./PropertiesMap").default | null
  >(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Dynamically import PropertiesMap only on the client
    import("./PropertiesMap")
      .then((module) => {
        setPropertiesMap(() => module.default);
      })
      .catch((err) => {
        console.error("Failed to load PropertiesMap:", err);
        setError(err);
      });
  }, []);

  if (error) {
    return (
      <div className="h-96 rounded-lg bg-red-50 p-4 text-red-700">
        <p className="font-semibold">Failed to load map</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  // Render nothing on server, show PropertiesMap only on client
  return (
    PropertiesMap && (
      <PropertiesMap
        properties={properties}
        latitude={latitude}
        longitude={longitude}
      />
    )
  );
}

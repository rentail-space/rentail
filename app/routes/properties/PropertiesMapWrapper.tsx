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

  useEffect(() => {
    // Dynamically import PropertiesMap only on the client
    import("./PropertiesMap").then((module) => {
      setPropertiesMap(() => module.default);
    });
  }, []);

  // Render nothing on server, show PropertiesMap only on client
  if (!PropertiesMap) return null;

  return (
    <PropertiesMap
      properties={properties}
      latitude={latitude}
      longitude={longitude}
    />
  );
}

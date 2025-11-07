import type { PropertyGetPayload } from "prisma/generated/models";
import { lazy, Suspense } from "react";

const PropertiesMap = lazy(() => import("./PropertiesMap"));

/**
 * Wrapper component that lazily loads PropertiesMap only on the client.
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
  return (
    <Suspense
      fallback={<div className="h-96 animate-pulse rounded-lg bg-gray-200" />}
    >
      <PropertiesMap
        properties={properties}
        latitude={latitude}
        longitude={longitude}
      />
    </Suspense>
  );
}

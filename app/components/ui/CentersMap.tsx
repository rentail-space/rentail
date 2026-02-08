import { invariant, maxBy, minBy } from "es-toolkit";
import { MapPin } from "lucide-react";
import mapboxgl from "mapbox-gl";
import type { PropertyGetPayload } from "prisma/generated/models";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

/**
 * Called when the user clicks on a center outside the map and we want to center
 * the map on that center.
 */
export declare type CenterMapFunction = (point: {
  longitude: number;
  latitude: number;
}) => void;

/**
 * A map showing shopping centers.
 *
 * @param accessToken - The access token for the Mapbox API.
 * @param centerRef - A ref to a function that will center the map on a given center.
 * @param centers - The centers to display on the map.
 * @param latitude - The latitude of the center to display on the map.
 * @param longitude - The longitude of the center to display on the map.
 * @returns A map showing shopping centers.
 */
export default function CentersMap({
  accessToken,
  centers,
  centerRef,
  latitude,
  longitude,
}: {
  accessToken: string;
  centers: PropertyGetPayload<{
    include: {
      spaces: true;
      state: true;
    };
  }>[];
  centerRef?: React.RefObject<CenterMapFunction | null>;
  latitude: number;
  longitude: number;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const rootsRef = useRef<ReturnType<typeof createRoot>[]>([]);
  const popupsRef = useRef<mapboxgl.Popup[]>([]);
  const escapeHandlerRef = useRef<((event: KeyboardEvent) => void) | null>(
    null,
  );
  const [webglError, setWebglError] = useState(false);

  if (centerRef)
    centerRef.current = (center: { longitude: number; latitude: number }) => {
      map.current?.setCenter([center.longitude, center.latitude]);
      map.current?.setZoom(10);
      mapContainer.current?.scrollIntoView({ behavior: "smooth" });
    };

  mapboxgl.accessToken = accessToken;

  useEffect(() => {
    // Only initialize on client side
    if (typeof window === "undefined") return;
    if (!mapContainer.current || map.current) return;
    if (!mapboxgl.accessToken) return;

    try {
      const hasCenter = !Number.isNaN(longitude) && !Number.isNaN(latitude);
      // https://docs.mapbox.com/mapbox-gl-js/api/map/#instance-members-interaction-handlers
      map.current = new mapboxgl.Map({
        center: hasCenter ? [longitude, latitude] : [-98.5795, 39.8283],
        container: mapContainer.current,
        doubleClickZoom: false,
        dragPan: true,
        scrollZoom: false,
        style: "mapbox://styles/mapbox/streets-v12",
        zoom: hasCenter ? calculateZoomLevel(centers) : 4,
      });
      setWebglError(false);
    } catch (error) {
      console.error("Failed to initialize Mapbox GL:", error);
      setWebglError(true);
      return;
    }

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Clean up function
    return () => {
      // Remove escape key handler
      if (escapeHandlerRef.current) {
        document.removeEventListener("keydown", escapeHandlerRef.current);
        escapeHandlerRef.current = null;
      }

      // Store old roots and clear ref immediately
      const oldRoots = rootsRef.current;
      rootsRef.current = [];

      // Unmount all React roots asynchronously to avoid race conditions
      queueMicrotask(() => {
        for (const root of oldRoots) root.unmount();
      });

      // Remove all markers
      for (const marker of markersRef.current) marker.remove();
      markersRef.current = [];

      // Remove map
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [centers, latitude, longitude]);

  // Add markers when centers change
  useEffect(() => {
    if (!map.current) return;

    // Store old roots and clear ref immediately
    const oldRoots = rootsRef.current;
    rootsRef.current = [];

    // Unmount old React roots asynchronously to avoid race conditions
    queueMicrotask(() => {
      for (const root of oldRoots) root.unmount();
    });

    // Remove existing markers and popups
    for (const marker of markersRef.current) marker.remove();
    markersRef.current = [];
    popupsRef.current = [];

    // Add new markers
    const validCenters = centers.filter(
      (center) =>
        typeof center.longitude === "number" &&
        typeof center.latitude === "number",
    );

    for (const center of validCenters) {
      // Create marker element with MapPin icon from lucide-react
      const el = document.createElement("div");
      el.className = "marker";
      el.style.cursor = "pointer";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.width = "32px";
      el.style.height = "40px";

      // Render the MapPin icon into the element
      const root = createRoot(el);
      root.render(
        <MapPin
          className="text-yellow-200"
          size={32}
          strokeWidth={2}
          fill="var(--color-yellow-500)"
        />,
      );
      rootsRef.current.push(root);

      // Create popup content using React and render to a DOM node
      const popupContentContainer = document.createElement("div");
      popupContentContainer.className = "w-64 pl-2 pr-8";

      // Use React to render popup content
      const popupRoot = createRoot(popupContentContainer);
      popupRoot.render(<CenterPopup center={center} />);

      // Create popup without close button
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        maxWidth: "256px",
      }).setDOMContent(popupContentContainer);

      // Add event listeners for popup open/close to handle Escape key
      popup.on("open", () => {
        // Remove existing escape handler if any
        if (escapeHandlerRef.current)
          document.removeEventListener("keydown", escapeHandlerRef.current);

        // Create new escape handler
        escapeHandlerRef.current = (event: KeyboardEvent) => {
          if (event.key === "Escape") {
            popup.remove();
            if (escapeHandlerRef.current) {
              document.removeEventListener("keydown", escapeHandlerRef.current);
              escapeHandlerRef.current = null;
            }
          }
        };

        // Add escape key listener
        document.addEventListener("keydown", escapeHandlerRef.current);
      });

      popup.on("close", () => {
        // Remove escape handler when popup closes
        if (escapeHandlerRef.current) {
          document.removeEventListener("keydown", escapeHandlerRef.current);
          escapeHandlerRef.current = null;
        }
      });

      // Create marker with popup
      // Use 'bottom' anchor - Mapbox will anchor the bottom-center of the element to the coordinates
      // The MapPin icon tip is at the bottom center
      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([center.longitude, center.latitude])
        .setPopup(popup)
        .addTo(map.current);

      markersRef.current.push(marker);
      popupsRef.current.push(popup);
    }
  }, [centers]);

  if (webglError) {
    return (
      <section className="relative flex h-96 w-full items-center justify-center overflow-hidden rounded-lg border-2 border-gray-300 bg-gray-50">
        <div className="text-center">
          <MapPin className="mx-auto mb-2 text-gray-400" size={48} />
          <p className="text-gray-600">Map unavailable</p>
          <p className="text-gray-500 text-sm">
            WebGL is required to display the map
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-96 w-full overflow-hidden rounded-lg bg-gray-100">
      <div ref={mapContainer} className="h-full w-full" />
      {centers.length > 1 && (
        <div className="absolute bottom-4 left-4 z-10 rounded-md bg-white px-3 py-2 text-gray-700 text-sm shadow-md">
          {centers.length} centers
        </div>
      )}
    </section>
  );
}

/**
 * A popup showing information about a shopping center.
 *
 * @param center - The center to display in the popup.
 * @returns A popup showing information about a shopping center.
 */
function CenterPopup({
  center,
}: {
  center: PropertyGetPayload<{
    include: {
      spaces: true;
      state: true;
    };
  }>;
}) {
  const directionsUrl = `https://maps.google.com/?q=${encodeURIComponent(`${center.address}, ${center.city}, ${center.state} ${center.state.country}`)}`;

  return (
    <div className="space-y-2">
      <h3 className="line-clamp-1 font-bold text-lg">{center.name}</h3>
      <address className="text-gray-500 text-sm">
        <p>{center.address}</p>
        <p>
          {center.city}, {center.state.abbreviation}
        </p>
      </address>

      <div className="flex flex-row justify-between gap-2">
        <span className="text-gray-500 text-sm">
          {center.spaces.length}{" "}
          {center.spaces.length === 1 ? "space" : "spaces"}
        </span>
        <a
          className="text-blue-500 underline hover:decoration-[hsl(37,92%,65%)]"
          href={directionsUrl}
          rel="noopener noreferrer"
          tabIndex={-1}
          target="_blank"
        >
          Directions
        </a>
      </div>
    </div>
  );
}

/**
 * Calculates the zoom level for a map so we can see all the centers.
 *
 * @param centers - The centers to calculate the zoom level for.
 * @returns The zoom level for the map so we can see all the centers.
 */
function calculateZoomLevel(
  centers: PropertyGetPayload<{
    select: {
      latitude: true;
      longitude: true;
    };
  }>[],
): number {
  try {
    invariant(centers.length >= 2, "At least two centers are required");
    const latitudeRange =
      (maxBy(centers, (center) => center.latitude)?.latitude ?? 0) -
      (minBy(centers, (center) => center.latitude)?.latitude ?? 0);
    const longitudeRange =
      (maxBy(centers, (center) => center.longitude)?.longitude ?? 0) -
      (minBy(centers, (center) => center.longitude)?.longitude ?? 0);
    const maxRange = Math.max(latitudeRange, longitudeRange);
    invariant(maxRange > 0, "Max range must be greater than 0");
    return 10 - Math.log2(maxRange * 8);
  } catch {
    return 11;
  }
}

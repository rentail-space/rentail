import { MapPin } from "lucide-react";
import mapboxgl from "mapbox-gl";
import type { PropertyGetPayload } from "prisma/generated/models";
import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";

export default function PropertiesMap({
  latitude,
  longitude,
  mapboxToken,
  centers,
}: {
  latitude: number;
  longitude: number;
  mapboxToken: string;
  centers: PropertyGetPayload<{ include: { spaces: true } }>[];
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const rootsRef = useRef<ReturnType<typeof createRoot>[]>([]);
  const popupsRef = useRef<mapboxgl.Popup[]>([]);
  const escapeHandlerRef = useRef<((event: KeyboardEvent) => void) | null>(
    null,
  );

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [longitude, latitude],
      zoom: 9,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Clean up function
    return () => {
      // Remove escape key handler
      if (escapeHandlerRef.current) {
        document.removeEventListener("keydown", escapeHandlerRef.current);
        escapeHandlerRef.current = null;
      }

      // Unmount all React roots
      for (const root of rootsRef.current) {
        root.unmount();
      }
      rootsRef.current = [];

      // Remove all markers
      for (const marker of markersRef.current) {
        marker.remove();
      }
      markersRef.current = [];

      // Remove map
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken, latitude, longitude]);

  // Add markers when centers change
  useEffect(() => {
    if (!map.current) return;

    // Unmount existing React roots
    for (const root of rootsRef.current) {
      root.unmount();
    }
    rootsRef.current = [];

    // Remove existing markers and popups
    for (const marker of markersRef.current) {
      marker.remove();
    }
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
          className="text-red-500"
          size={32}
          strokeWidth={2}
          fill="#EA4335"
        />,
      );
      rootsRef.current.push(root);

      // Create popup content
      const popupContent = document.createElement("div");
      popupContent.style.padding = "8px";
      popupContent.style.minWidth = "200px";

      // Center name
      const nameDiv = document.createElement("div");
      nameDiv.style.fontWeight = "600";
      nameDiv.style.fontSize = "14px";
      nameDiv.style.marginBottom = "4px";
      nameDiv.style.color = "#1f2937";
      nameDiv.textContent = center.name;

      // Address
      const addressDiv = document.createElement("div");
      addressDiv.style.fontSize = "12px";
      addressDiv.style.color = "#6b7280";
      addressDiv.style.marginBottom = "4px";
      addressDiv.textContent = `${center.address}, ${center.city}, ${center.state}`;

      // Spaces count
      const spacesDiv = document.createElement("div");
      spacesDiv.style.fontSize = "12px";
      spacesDiv.style.color = "#285ca0";
      spacesDiv.style.fontWeight = "500";
      spacesDiv.textContent = `${center.spaces.length} ${center.spaces.length === 1 ? "space" : "spaces"}`;

      popupContent.appendChild(nameDiv);
      popupContent.appendChild(addressDiv);
      popupContent.appendChild(spacesDiv);

      // Create popup without close button
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
      }).setDOMContent(popupContent);

      // Add event listeners for popup open/close to handle Escape key
      popup.on("open", () => {
        // Remove existing escape handler if any
        if (escapeHandlerRef.current) {
          document.removeEventListener("keydown", escapeHandlerRef.current);
        }

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

  return (
    <div className="relative h-96 w-full overflow-hidden rounded-lg bg-gray-100">
      <div ref={mapContainer} className="h-full w-full" />
      <div className="absolute bottom-4 left-4 z-10 rounded-md bg-white px-3 py-2 text-gray-700 text-sm shadow-md">
        {centers.length} centers
      </div>
    </div>
  );
}

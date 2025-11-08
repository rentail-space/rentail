import mapboxgl from "mapbox-gl";
import type { PropertyGetPayload } from "prisma/generated/models";
import { useEffect, useRef } from "react";

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

    // Remove existing markers
    for (const marker of markersRef.current) {
      marker.remove();
    }
    markersRef.current = [];

    // Add new markers
    const validCenters = centers.filter(
      (center) =>
        typeof center.longitude === "number" &&
        typeof center.latitude === "number",
    );

    for (const center of validCenters) {
      // Create classic pin marker using SVG for precise positioning
      // Pin is 30px wide, 45px tall (30px circle + 15px triangle)
      // The tip is at the bottom center (15px from left, 45px from top)
      const el = document.createElement("div");
      el.className = "marker";
      el.style.width = "30px";
      el.style.height = "45px";
      el.style.cursor = "pointer";

      // Create SVG pin marker
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "30");
      svg.setAttribute("height", "45");
      svg.setAttribute("viewBox", "0 0 30 45");
      svg.style.display = "block";

      // Pin tail (triangle) - tip at bottom center (15, 45)
      const triangle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );
      triangle.setAttribute("d", "M 15 45 L 0 30 L 30 30 Z");
      triangle.setAttribute("fill", "#285ca0");
      triangle.setAttribute("filter", "drop-shadow(0 2px 2px rgba(0,0,0,0.3))");

      // Pin head (circle) - centered at (15, 15) with radius 15
      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      circle.setAttribute("cx", "15");
      circle.setAttribute("cy", "15");
      circle.setAttribute("r", "14");
      circle.setAttribute("fill", "#285ca0");
      circle.setAttribute("stroke", "white");
      circle.setAttribute("stroke-width", "2");
      circle.setAttribute("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.3))");

      svg.appendChild(triangle);
      svg.appendChild(circle);
      el.appendChild(svg);

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

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
      }).setDOMContent(popupContent);

      // Create marker with popup
      // Use 'bottom' anchor - Mapbox will anchor the bottom-center of the element to the coordinates
      // The pin tip is at the bottom center (15px from left edge, 45px from top)
      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([center.longitude, center.latitude])
        .setPopup(popup)
        .addTo(map.current);

      markersRef.current.push(marker);
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

"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import type { Icon } from "leaflet";
import type { PropertyGetPayload } from "prisma/generated/models";
import type {
  MapContainerProps,
  MarkerProps,
  PopupProps,
  TileLayerProps,
} from "react-leaflet";

// Fix for default marker icons in Leaflet with dynamic imports
let DefaultIcon: Icon | null = null;

async function initializeDefaultIcon(): Promise<Icon> {
  if (DefaultIcon) return DefaultIcon;

  try {
    // Dynamically import Leaflet only on client
    const leaflet = await import("leaflet");

    DefaultIcon = leaflet.icon({
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    // Set as default for all markers
    if (leaflet.Marker.prototype.setIcon) {
      leaflet.Marker.prototype.setIcon(DefaultIcon);
    }
  } catch (err) {
    console.error("Failed to initialize Leaflet icon:", err);
    throw err;
  }

  return DefaultIcon;
}

type MapComponentsType = {
  MapContainer: ComponentType<MapContainerProps>;
  Marker: ComponentType<MarkerProps>;
  Popup: ComponentType<PopupProps>;
  TileLayer: ComponentType<TileLayerProps>;
};

export default function PropertiesMap({
  properties,
  latitude,
  longitude,
}: {
  properties: PropertyGetPayload<{ include: { spaces: true } }>[];
  latitude: number;
  longitude: number;
}) {
  const [MapComponents, setMapComponents] = useState<MapComponentsType | null>(
    null,
  );
  const [icon, setIcon] = useState<Icon | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMap() {
      try {
        const { MapContainer, Marker, Popup, TileLayer } = await import(
          "react-leaflet"
        );
        const defaultIcon = await initializeDefaultIcon();

        setMapComponents({ MapContainer, Marker, Popup, TileLayer });
        setIcon(defaultIcon);
      } catch (err) {
        console.error("Failed to load map components:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load map components",
        );
      }
    }

    loadMap();
  }, []);

  if (error) {
    return (
      <div className="h-96 rounded-lg bg-red-50 p-4 text-red-700">
        <p className="font-semibold">Failed to load map</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!MapComponents || !icon) {
    return <div className="h-96 animate-pulse rounded-lg bg-gray-200" />;
  }

  const { MapContainer, Marker, Popup, TileLayer } = MapComponents;

  return (
    <div className="h-96 w-full overflow-hidden">
      <MapContainer
        center={[latitude, longitude]}
        className="h-full w-full"
        zoom={10}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {properties.map((property) => (
          <PropertyMarker
            key={property.id}
            property={property}
            Marker={Marker}
            Popup={Popup}
            icon={icon}
          />
        ))}
      </MapContainer>
    </div>
  );
}

function PropertyMarker({
  property,
  Marker,
  Popup,
  icon,
}: {
  property: PropertyGetPayload<{ include: { spaces: true } }>;
  Marker: MapComponentsType["Marker"];
  Popup: MapComponentsType["Popup"];
  icon: Icon;
}) {
  return (
    <Marker
      key={property.id}
      position={[property.latitude, property.longitude]}
      icon={icon}
    >
      <Popup>
        <h4 style={{ margin: 0 }} className="font-bold text-lg">
          {property.name}
        </h4>
        <p>
          {property.address}, {property.city}, {property.state}
        </p>
        <p style={{ margin: 0 }}>{property.spaces.length} available spaces</p>
      </Popup>
    </Marker>
  );
}

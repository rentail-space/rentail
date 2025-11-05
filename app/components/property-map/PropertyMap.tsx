"use client";

import type { LatLngExpression } from "leaflet";
import leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PropertyGetPayload } from "prisma/generated/models";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

// Fix for default marker icons in Leaflet with dynamic imports
const DefaultIcon = leaflet.icon({
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

leaflet.Marker.prototype.setIcon(DefaultIcon);

interface PropertyMapProps {
  properties: PropertyGetPayload<{ include: { spaces: true } }>[];
}

export default function PropertyMap({ properties }: PropertyMapProps) {
  // Los Angeles County center coordinates
  const center: LatLngExpression = [34.0522, -118.2437];

  return (
    <div className="h-96 w-full overflow-hidden rounded-lg border border-gray-300">
      <MapContainer
        center={center}
        zoom={10}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {properties.map((property) => (
          <Marker
            key={property.id}
            position={[property.latitude, property.longitude]}
            icon={DefaultIcon}
          >
            <Popup>
              <div className="flex flex-col gap-2">
                <h4 className="font-bold">{property.name}</h4>
                <p className="text-sm">
                  {property.address}, {property.city}, {property.state}
                </p>
                <p className="text-gray-600 text-xs">
                  {property.spaces.length} space
                  {property.spaces.length !== 1 ? "s" : ""}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

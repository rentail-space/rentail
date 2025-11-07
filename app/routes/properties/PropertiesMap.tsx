import "leaflet/dist/leaflet.css";
import leaflet from "leaflet";
import type { PropertyGetPayload } from "prisma/generated/models";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

// Fix for default marker icons in Leaflet with dynamic imports
let DefaultIcon: leaflet.Icon | null = null;

function initializeDefaultIcon() {
  if (DefaultIcon) return DefaultIcon;

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
  leaflet.Marker.prototype.setIcon(DefaultIcon);
  return DefaultIcon;
}

export default function PropertiesMap({
  properties,
  latitude,
  longitude,
}: {
  properties: PropertyGetPayload<{ include: { spaces: true } }>[];
  latitude: number;
  longitude: number;
}) {
  // Initialize icon on component mount
  const icon = initializeDefaultIcon();

  return (
    <div className="h-96 w-full overflow-hidden">
      <MapContainer
        center={[latitude, longitude]}
        className="h-full w-full"
        zoom={10}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {properties.map((property) => (
          <PropertyMarker key={property.id} property={property} icon={icon} />
        ))}
      </MapContainer>
    </div>
  );
}

function PropertyMarker({
  property,
  icon,
}: {
  property: PropertyGetPayload<{ include: { spaces: true } }>;
  icon: leaflet.Icon | null;
}) {
  return (
    <Marker
      key={property.id}
      position={[property.latitude, property.longitude]}
      icon={icon || undefined}
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

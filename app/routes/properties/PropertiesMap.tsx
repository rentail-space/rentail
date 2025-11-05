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

export default function PropertiesMap({
  properties,
  latitude,
  longitude,
}: {
  properties: PropertyGetPayload<{ include: { spaces: true } }>[];
  latitude: number;
  longitude: number;
}) {
  return (
    <div className="h-96 w-full overflow-hidden rounded-lg border border-gray-300">
      <MapContainer
        center={[latitude, longitude]}
        zoom={10}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {properties.map((property) => (
          <PropertyMarker key={property.id} property={property} />
        ))}
      </MapContainer>
    </div>
  );
}

function PropertyMarker({
  property,
}: {
  property: PropertyGetPayload<{ include: { spaces: true } }>;
}) {
  return (
    <Marker
      key={property.id}
      position={[property.latitude, property.longitude]}
      icon={DefaultIcon}
    >
      <Popup>
        <div className="flex flex-col gap-2">
          <h4 style={{ margin: 0 }} className="font-bold text-lg">
            {property.name}
          </h4>
          <p style={{ margin: 0 }}>
            {property.address}, {property.city}, {property.state}
          </p>
          <p style={{ margin: 0 }}>{property.spaces.length} available spaces</p>
        </div>
      </Popup>
    </Marker>
  );
}

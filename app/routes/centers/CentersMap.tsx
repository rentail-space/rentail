import type { PropertyGetPayload } from "prisma/generated/models";

export default function PropertiesMap({
  latitude,
  longitude,
  mapboxToken,
  centers,
  width,
  height,
}: {
  latitude: number;
  longitude: number;
  mapboxToken: string;
  centers: PropertyGetPayload<{ include: { spaces: true } }>[];
  width: number;
  height: number;
}) {
  const zoom = 9;

  const markers = centers
    .filter(
      (center) =>
        typeof center.longitude === "number" &&
        typeof center.latitude === "number",
    )
    .map((center) => `pin-s+285ca0(${center.longitude},${center.latitude})`)
    .join(",");

  const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${markers ? markers + "/" : ""}${longitude},${latitude},${zoom}/${width}x${height}@2x?access_token=${mapboxToken}`;

  return (
    <div className="relative h-96 w-full overflow-hidden rounded-lg bg-gray-100">
      <img
        src={staticMapUrl}
        alt="Properties map"
        className="h-full w-full object-cover"
      />
      <div className="absolute bottom-4 left-4 rounded-md bg-white px-3 py-2 text-gray-700 text-sm shadow-md">
        {centers.length} centers
      </div>
    </div>
  );
}

import type { PropertyGetPayload } from "prisma/generated/models";

export default function CenterPopup({
  center,
}: {
  center: PropertyGetPayload<{ include: { spaces: true } }>;
}) {
  const directionsUrl = `https://maps.google.com/?q=${encodeURIComponent(`${center.address}, ${center.city}, ${center.state} ${center.country}`)}`;

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="font-bold text-base text-gray-800">{center.name}</div>
      <div className="text-gray-500 text-sm">
        <div>{center.address.split(",")[0]}</div>
        <div>{center.address.split(",").slice(1).join(", ")}</div>
      </div>

      <div className="flex flex-row justify-between gap-2 font-medium text-sm">
        <div className="text-gray-700">
          {center.spaces.length}{" "}
          {center.spaces.length === 1 ? "space" : "spaces"}
        </div>
        <a
          className="text-blue-600 hover:underline"
          href={directionsUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Directions
        </a>
      </div>
    </div>
  );
}

import type { PropertyGetPayload } from "prisma/generated/models";

export default function CenterPopup({
  center,
}: {
  center: PropertyGetPayload<{ include: { spaces: true } }>;
}) {
  const directionsUrl = `https://maps.google.com/?q=${encodeURIComponent(`${center.address}, ${center.city}, ${center.state} ${center.country}`)}`;

  return (
    <div className="space-y-2">
      <h3 className="line-clamp-1 font-bold text-lg">{center.name}</h3>
      <address className="text-sm text-gray-500">
          <p>{center.address.split(",")[0]}</p>
          <p>{center.address.split(",").slice(1).join(", ")}</p>
        </address>

        <div className="flex flex-row justify-between gap-2">
          <span className="text-sm text-gray-500">
            {center.spaces.length}{" "}
            {center.spaces.length === 1 ? "space" : "spaces"}
          </span>
          <a
            className="link link-primary link-hover"
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

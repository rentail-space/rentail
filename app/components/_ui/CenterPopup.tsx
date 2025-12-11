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
      <address className="text-gray-500 text-sm">
        <p>{center.address.split(",")[0]}</p>
        <p>{center.address.split(",").slice(1).join(", ")}</p>
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
          target="_blank"
        >
          Directions
        </a>
      </div>
    </div>
  );
}

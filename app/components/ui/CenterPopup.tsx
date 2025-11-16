import type { PropertyGetPayload } from "prisma/generated/models";

export default function CenterPopup({
  center,
}: {
  center: PropertyGetPayload<{ include: { spaces: true } }>;
}) {
  const directionsUrl = `https://maps.google.com/?q=${encodeURIComponent(`${center.address}, ${center.city}, ${center.state} ${center.country}`)}`;

  return (
    <div className="card">
      <div className="card-body px-0 py-2">
        <div className="card-title line-clamp-1">{center.name}</div>
        <address className="card-content">
          <p>{center.address.split(",")[0]}</p>
          <p>{center.address.split(",").slice(1).join(", ")}</p>
        </address>

        <div className="card-actions">
          <span>
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
    </div>
  );
}

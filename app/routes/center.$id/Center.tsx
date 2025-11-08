import { ExternalLink } from "lucide-react";
import type { PropertyGetPayload } from "prisma/generated/models";
import { Link } from "react-router";
import remarkGfm from "remark-gfm";
import { Streamdown } from "streamdown";
import CentersMap from "../../components/ui/CentersMap";
import { Spaces } from "./Spaces";

export default function Center({
  center,
}: {
  center: PropertyGetPayload<{ include: { spaces: true } }>;
}) {
  return (
    <div className="mx-auto my-10 flex max-w-xl flex-col gap-4">
      <h1 className="font-bold text-4xl">
        {center.website ? (
          <Link to={center.website} target="_blank" rel="noopener noreferrer">
            {center.name}
          </Link>
        ) : (
          center.name
        )}
      </h1>

      <section>
        <Link
          to={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${center.address}, ${center.city}, ${center.state} ${center.country}`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-row items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <span>
            {center.address}, {center.city}, {center.state}
          </span>
          <ExternalLink className="h-4 w-4" />
        </Link>
      </section>

      {center.imageURLs.length > 0 && (
        <section>
          <img
            className="rounded-lg"
            src={center.imageURLs[0]}
            alt={center.name}
          />
        </section>
      )}

      <section className="prose prose-lg">
        <Streamdown remarkPlugins={[[remarkGfm, {}]]}>
          {center.description}
        </Streamdown>
      </section>

      <section className="flex flex-col gap-4">
        <Spaces spaces={center.spaces} />
      </section>

      <CentersMap
        centers={[center]}
        latitude={center.latitude ?? 0}
        longitude={center.longitude ?? 0}
        zoom={12}
      />
    </div>
  );
}

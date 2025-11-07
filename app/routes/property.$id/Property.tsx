import { ExternalLink } from "lucide-react";
import type { PropertyGetPayload } from "prisma/generated/models";
import { Link } from "react-router";
import remarkGfm from "remark-gfm";
import { Streamdown } from "streamdown";
import { Spaces } from "./Spaces";

export default function Property({
  property,
}: {
  property: PropertyGetPayload<{ include: { spaces: true } }>;
}) {
  return (
    <div className="mx-auto my-10 flex max-w-xl flex-col gap-4">
      <h1 className="font-bold text-4xl">
        {property.website ? (
          <Link to={property.website} target="_blank" rel="noopener noreferrer">
            {property.name}
          </Link>
        ) : (
          property.name
        )}
      </h1>

      <section>
        <Link
          to={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${property.address}, ${property.city}, ${property.state} ${property.country}`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-row items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <span>
            {property.address}, {property.city}, {property.state}
          </span>
          <ExternalLink className="h-4 w-4" />
        </Link>
      </section>

      {property.imageURLs.length > 0 && (
        <section>
          <img
            className="rounded-lg"
            src={property.imageURLs[0]}
            alt={property.name}
          />
        </section>
      )}

      <section className="prose prose-lg">
        <Streamdown remarkPlugins={[[remarkGfm, {}]]}>
          {property.description}
        </Streamdown>
      </section>

      <section className="flex flex-col gap-4">
        <Spaces spaces={property.spaces} />
      </section>
    </div>
  );
}

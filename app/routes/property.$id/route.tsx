import { Markdown } from "@react-email/components";
import { ExternalLink } from "lucide-react";
import type { PropertySpace } from "prisma/generated/client";
import { Link, useLoaderData } from "react-router";
import prisma from "~/lib/prisma";
import type { Route } from "./+types/route";

export async function loader({ params }: Route.LoaderArgs) {
  const property = await prisma.property.findUnique({
    include: { spaces: true },
    where: { id: params.id },
  });
  if (!property) throw new Response("Not Found", { status: 404 });
  return property;
}

export default function Property() {
  const property = useLoaderData<typeof loader>();
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
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

      <section className="prose prose-lg">
        <Markdown>{property.description}</Markdown>
      </section>

      <section>
        <img
          className="rounded-lg"
          src={property.imageURLs[0]}
          alt={property.name}
        />
      </section>

      <section className="flex flex-col gap-4">
        {property.spaces.map((space) => (
          <Space key={space.id} space={space as never} />
        ))}
      </section>
    </div>
  );
}

function Space({ space }: { space: PropertySpace }) {
  return (
    <div className="rounded-lg border border-gray-300 p-4">
      <h2 className="font-bold text-xl">{space.number}</h2>
      <div className="grid grid-cols-4 gap-4">
        <Metric
          label="size"
          value={space.size.toLocaleString(undefined, { style: "decimal" })}
          unit="sqft"
        />
        <Metric label="type" value={space.type} />
        <Metric
          label="floor"
          value={space.floor.toLocaleString(undefined, { style: "decimal" })}
          unit="floor"
        />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <p className="flex flex-col items-center justify-center gap-2">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="font-bold text-2xl">{value}</span>
      <span className="text-gray-500 text-sm">{unit || " . "}</span>
    </p>
  );
}

import { Markdown } from "@react-email/components";
import { IconExternalLink } from "obra-icons-react";
import type { PropertySpace } from "prisma/generated/client";
import { Link, useLoaderData } from "react-router";
import prisma from "~/lib/prisma";
import type { Route } from "./+types/route";

export async function loader({ params }: Route.LoaderArgs) {
  const property = await prisma.property.findUnique({
    include: { spaces: true },
    where: { slug: params.slug },
  });
  if (!property) throw new Response("Not Found", { status: 404 });
  return property;
}

export default function Property() {
  const property = useLoaderData<typeof loader>();
  return (
    <div className="mx-auto max-w-xl flex flex-col gap-4">
      <h1 className="text-4xl font-bold">
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
          className="text-blue-600 hover:text-blue-800 flex flex-row items-center gap-2"
        >
          <span>
            {property.address}, {property.city}, {property.state}
          </span>
          <IconExternalLink className="w-4 h-4" />
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
    <div className="border border-gray-300 rounded-lg p-4">
      <h2 className="text-xl font-bold">{space.name}</h2>
      <div className="prose prose-lg">
        <Markdown>{space.details}</Markdown>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <Metric
          label="cost"
          value={space.cost.toLocaleString(undefined, {
            style: "currency",
            currency: "USD",
          })}
          unit="pre week"
        />
        <Metric
          label="size"
          value={space.size.toLocaleString(undefined, { style: "decimal" })}
          unit="sqft"
        />
        <Metric
          label="foot traffic"
          value={space.footTraffic.toLocaleString(undefined, {
            style: "decimal",
          })}
          unit="visitors"
        />
        <Metric label="available" value={space.available} />
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
    <p className="flex flex-col gap-2 justify-center items-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="font-bold text-2xl">{value}</span>
      <span className="text-sm text-gray-500">{unit || " . "}</span>
    </p>
  );
}

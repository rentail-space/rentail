import { Link } from "@react-email/components";
import type { PropertySpace } from "prisma/generated/client";
import type { PropertyGetPayload } from "prisma/generated/models";
import prisma from "~/lib/prisma";

export async function loader() {
  const properties = await prisma.property.findMany({
    include: { spaces: true },
  });
  return properties;
}

export default function PropertyPage({
  loaderData,
}: {
  loaderData: PropertyGetPayload<{ include: { spaces: true } }>[];
}) {
  return (
    <div className="prose mx-auto flex flex-col gap-4">
      {loaderData.map((property) => (
        <Property key={property.id} property={property} />
      ))}
    </div>
  );
}

function Property({
  property,
}: {
  property: PropertyGetPayload<{ include: { spaces: true } }>;
}) {
  const paragraphs = property.description.split("\n");

  return (
    <div key={property.id} className="flex flex-col gap-2">
      <h3>
        <Link href={`/property/${property.id}`}>{property.name}</Link>
      </h3>
      <Link
        href={`https://maps.google.com/?q=${encodeURIComponent(`${property.address}, ${property.city}, ${property.state} ${property.country}`)}`}
      >
        {property.address}, {property.city}, {property.state}
      </Link>
      <details>
        <summary className="summary-open:hidden">{paragraphs[0]}</summary>
        {paragraphs.slice(1).map((line, index) => (
          <p key={index.toString()}>{line}</p>
        ))}
      </details>

      <Spaces spaces={property.spaces} />
    </div>
  );
}

function Spaces({ spaces }: { spaces: PropertySpace[] }) {
  if (spaces.length === 0)
    return <p className="text-center text-gray-500">No spaces available</p>;
  return (
    <table>
      <thead>
        <tr>
          <th>Number</th>
          <th>Size</th>
          <th>Type</th>
          <th>Floor</th>
        </tr>
      </thead>
      <tbody>
        {spaces
          .sort((a, b) =>
            a.type !== b.type
              ? a.type.localeCompare(b.type)
              : a.number.localeCompare(b.number),
          )
          .map((space) => (
            <tr key={space.id}>
              <td>{space.number}</td>
              <td>{space.size} sqft</td>
              <td>{space.type}</td>
              <td>{space.floor}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

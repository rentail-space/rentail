import type { PropertySpace } from "prisma/generated/client";
import type { PropertyGetPayload } from "prisma/generated/models";
import { Link } from "react-router";

export default function PropertiesList({
  properties,
}: {
  properties: PropertyGetPayload<{ include: { spaces: true } }>[];
}) {
  return (
    <div className="prose prose-md mx-auto flex flex-col gap-4">
      {properties.map((property) => (
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
    <section key={property.id} className="flex flex-col gap-2">
      <h3>
        <Link
          className="text-blue-500 no-underline hover:text-blue-700 hover:underline"
          to={`/property/${property.id}`}
        >
          {property.name}
        </Link>
      </h3>

      <Link
        className="text-blue-500 no-underline hover:text-blue-700 hover:underline"
        to={`https://maps.google.com/?q=${encodeURIComponent(`${property.address}, ${property.city}, ${property.state} ${property.country}`)}`}
        target="_blank"
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
    </section>
  );
}

function Spaces({ spaces }: { spaces: PropertySpace[] }) {
  return spaces.length > 0 ? (
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
  ) : (
    <p className="text-center text-gray-400 text-lg">No spaces available</p>
  );
}

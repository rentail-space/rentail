import { Link } from "react-router";
import prisma from "~/lib/prisma";

export async function loader() {
  const states = await prisma.state.findMany({
    orderBy: { name: "asc" },
  });

  const centers = await prisma.property.groupBy({
    by: ["state"],
    orderBy: { state: "asc" },
    _count: { _all: true },
  });
  return { states, centers };
}

export default function StatePage({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  return (
    <main className="container mx-auto my-10 space-y-8">
      <h1 className="font-bold text-2xl">US States</h1>

      <ul
        className="space-y-4"
        itemScope
        itemType="https://schema.org/ItemList"
      >
        {loaderData.states.map(({ abbreviation, name, lede }) => (
          <li
            key={abbreviation}
            className="border-gray-400 border-b pb-4"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            <LinkToState
              abbreviation={abbreviation}
              name={name}
              lede={lede}
              centers={loaderData.centers}
            />
          </li>
        ))}
      </ul>
    </main>
  );
}

function LinkToState({
  abbreviation,
  name,
  lede,
  centers,
}: {
  abbreviation: string;
  name: string;
  lede: string;
  centers: { state: string; _count: { _all: number } }[];
}) {
  const centerCount = centers.find(
    (center) => center.state.toLowerCase() === abbreviation.toLowerCase(),
  )?._count._all;
  return (
    <Link to={`/state/${abbreviation.toLowerCase()}`} className="space-y-2">
      <div className="flex flex-row justify-between">
        <h2 className="font-bold text-xl" itemProp="name">
          {name}
        </h2>
        {centerCount && centerCount > 5 && (
          <span className="text-gray-500" itemProp="description">
            {centerCount} centers
          </span>
        )}
      </div>
      <p className="text-gray-500" itemProp="description">
        {lede}
      </p>
    </Link>
  );
}

import { Link } from "react-router";
import { Streamdown } from "streamdown";
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
    <main className="container mx-auto my-10 max-w-3xl space-y-8">
      <h1 className="text-center font-bold text-2xl">US States</h1>

      <ul
        className="space-y-4"
        itemScope
        itemType="https://schema.org/ItemList"
      >
        {loaderData.states
          .filter(
            ({ abbreviation }) =>
              countCenters(loaderData.centers, abbreviation) > 0,
          )

          .map(({ abbreviation, name, lede }) => (
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
  return (
    <Link to={`/state/${abbreviation.toLowerCase()}`} className="space-y-2">
      <div className="flex flex-row justify-between">
        <h2 className="font-bold text-xl" itemProp="name">
          {name}
        </h2>
        <span className="text-gray-500" itemProp="description">
          {countCenters(centers, abbreviation)} centers
        </span>
      </div>
      <Streamdown className="text-gray-500" mode="static">
        {lede}
      </Streamdown>
    </Link>
  );
}

function countCenters(
  centers: { state: string; _count: { _all: number } }[],
  abbreviation: string,
): number {
  return (
    centers.find(
      (center) => center.state.toLowerCase() === abbreviation.toLowerCase(),
    )?._count._all ?? 0
  );
}

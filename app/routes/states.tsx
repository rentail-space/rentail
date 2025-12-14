import { Link } from "react-router";
import expandStateAbbr from "~/lib/expandStateAbbr";
import prisma from "~/lib/prisma";

export async function loader() {
  const states = await prisma.property.groupBy({
    by: ["state"],
    orderBy: { state: "asc" },
    _avg: {
      latitude: true,
      longitude: true,
    },
    _count: { _all: true },
  });
  return { states };
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
        {loaderData.states.map(({ state, _count }) => (
          <li
            key={state}
            className="border-gray-400 border-b pb-4"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            <Link
              to={`/state/${state}`}
              className="flex flex-row items-center justify-between gap-2"
            >
              <h2 className="font-bold text-xl" itemProp="name">
                {expandStateAbbr(state)}
              </h2>
              <p className="text-gray-500" itemProp="description">
                {_count._all} centers
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

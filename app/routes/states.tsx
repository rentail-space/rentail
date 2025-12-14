import { Link } from "react-router";
import prisma from "~/lib/prisma";
import getUSState from "./getUSState";

export async function loader() {
  const states = await prisma.property.groupBy({
    by: ["state"],
    orderBy: { state: "asc" },
    _count: { _all: true },
  });
  return { states };
}

export default function StatePage({
  loaderData,
}: {
  loaderData: {
    states: {
      state: string;
      _count: { _all: number };
    }[];
  };
}) {
  return (
    <main className="mx-auto my-10 max-w-4xl">
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
            <Link to={`/state/${state}`}>
              <h2 className="font-bold text-xl" itemProp="name">
                {getUSState(state)}
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

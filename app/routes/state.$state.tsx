import { clamp, range } from "es-toolkit";
import { StarIcon } from "lucide-react";
import type { PropertyGetPayload } from "prisma/generated/models";
import { Link } from "react-router";
import prisma from "~/lib/prisma";
import type { Route } from "./+types/state.$state";
import getUSState from "./usStates";

export async function loader({ params }: Route.LoaderArgs) {
  const state = params.state.toUpperCase();
  const centers = await prisma.property.findMany({
    select: { id: true, name: true, rating: true, summary: true },
    where: { state },
  });
  return { centers, state };
}

export default function StatePage({
  loaderData,
}: {
  loaderData: {
    centers: PropertyGetPayload<{
      select: { id: true; name: true; rating: true; summary: true };
    }>[];
    state: string;
  };
}) {
  return (
    <main className="mx-auto my-10 max-w-4xl space-y-8 px-4">
      <h1 className="text-center font-bold text-2xl">
        {getUSState(loaderData.state)}
      </h1>
      <ul
        className="space-y-4"
        itemScope
        itemType="https://schema.org/ItemList"
      >
        {loaderData.centers.map((center) => (
          <li
            key={center.id}
            className="border-gray-400 border-b pb-4"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            <h2 className="font-bold text-xl" itemProp="name">
              <Link to={`/center/${center.id}`}>{center.name}</Link>
            </h2>
            <p className="space-x-1">
              {center.rating && <Stars rating={center.rating / 10} />}
              <span itemProp="description">{center.summary}</span>
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div
      className="inline-flex flex-row gap-0"
      itemProp="ratingValue"
      itemType="https://schema.org/AggregateRating"
      title={rating.toFixed(1)}
    >
      {range(0, 5, 1).map((i) => (
        <StarIcon
          key={i}
          className="h-4 w-4 text-yellow-500"
          fill={i + 0.5 <= clamp(rating, 1, 5) ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

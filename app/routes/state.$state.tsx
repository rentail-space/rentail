import { clamp, range } from "es-toolkit";
import { StarIcon } from "lucide-react";
import { Link } from "react-router";
import expandStateAbbr from "~/lib/expandStateAbbr";
import prisma from "~/lib/prisma";
import type { Route } from "./+types/state.$state";

export async function loader({ params }: Route.LoaderArgs) {
  const state = params.state.toUpperCase();
  const centers = await prisma.property.findMany({
    select: {
      id: true,
      name: true,
      rating: true,
      summary: true,
      city: true,
    },
    where: { state },
  });
  return { centers, state };
}

export default function StatePage({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  return (
    <main className="container mx-auto my-10 space-y-8">
      <h1 className="text-center font-bold text-2xl">
        {expandStateAbbr(loaderData.state)}
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
            <h2
              className="flex flex-row items-center justify-between gap-2 font-bold text-xl"
              itemProp="name"
            >
              <Link to={`/center/${center.id}`}>{center.name}</Link>
              <span className="text-gray-500 text-sm">{center.city}</span>
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

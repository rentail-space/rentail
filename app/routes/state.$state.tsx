import { clamp, meanBy, range } from "es-toolkit";
import { MapPinIcon, StarIcon } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router";
import CentersMap from "~/components/ui/CentersMap";
import expandStateAbbr from "~/lib/expandStateAbbr";
import prisma from "~/lib/prisma";
import type { Route } from "./+types/state.$state";

export async function loader({ params }: Route.LoaderArgs) {
  const state = params.state.toUpperCase();
  const centers = await prisma.property.findMany({
    select: {
      address: true,
      country: true,
      id: true,
      name: true,
      rating: true,
      summary: true,
      city: true,
      longitude: true,
      latitude: true,
      state: true,
      spaces: {
        select: { id: true },
        where: { available: true },
      },
    },
    orderBy: { name: "asc" },
    where: { state },
  });
  return { centers, state };
}

export default function StatePage({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  const centerRef =
    useRef<(center: { longitude: number; latitude: number }) => void>(null);
  const { centers, state } = loaderData;

  return (
    <main className="container mx-auto my-10 space-y-8">
      <h1 className="text-center font-bold text-2xl">
        {expandStateAbbr(state)}
      </h1>

      <CentersMap
        centerRef={centerRef}
        centers={centers}
        latitude={meanBy(centers, (center) => center.latitude)}
        longitude={meanBy(centers, (center) => center.longitude)}
      />

      <ul
        className="space-y-4"
        itemScope
        itemType="https://schema.org/ItemList"
      >
        {centers.map((center) => (
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
              <span className="flex flex-row flex-nowrap items-center gap-2 text-gray-500 text-sm">
                {center.city}
                <MapPinIcon
                  onClick={(event) => {
                    event.preventDefault();
                    centerRef.current?.({
                      longitude: center.longitude ?? 0,
                      latitude: center.latitude ?? 0,
                    });
                  }}
                  className="h-6 w-6 cursor-pointer text-blue-500"
                />
              </span>
            </h2>
            <p className="space-x-1">
              {center.rating && <Stars rating={center.rating} />}
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

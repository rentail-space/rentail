import { clamp, meanBy, range } from "es-toolkit";
import { MapPinIcon, MoveLeftIcon, StarIcon } from "lucide-react";
import { Children, Fragment, useRef } from "react";
import { Link } from "react-router";
import CentersMap from "~/components/ui/CentersMap";
import expandStateAbbr from "~/lib/expandStateAbbr";
import prisma from "~/lib/prisma";
import timeOfDay from "~/lib/timeOfDay";
import type { Route } from "./+types/state.$state";

export async function loader({ params }: Route.LoaderArgs) {
  const state = params.state.toUpperCase();
  const centers = await prisma.property.findMany({
    include: {
      spaces: true,
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
      <div className="flex w-full items-center">
        <Link
          to="/states"
          className="hidden w-1/2 flex-row items-center gap-2 md:flex print:hidden"
        >
          <MoveLeftIcon className="h-4 w-4" />
          All States
        </Link>

        <h1 className="text-center font-bold text-2xl">
          {expandStateAbbr(state)}
        </h1>

        <span className="w-1/2" />
      </div>

      <CentersMap
        centerRef={centerRef}
        centers={centers}
        latitude={meanBy(centers, (center) => center.latitude)}
        longitude={meanBy(centers, (center) => center.longitude)}
      />

      <ul
        className="space-y-4 divide-y divide-gray-400"
        itemScope
        itemType="https://schema.org/ItemList"
      >
        {centers.map((center) => (
          <li
            key={center.id}
            className="space-y-2 pb-4"
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

            <p className="space-x-2">
              {center.rating && center.rating >= 3 && (
                <RatingStars rating={center.rating} />
              )}
              <span itemProp="description">{center.summary}</span>
            </p>

            <CenterStats>
              {center.numberOfStores >= 30 && (
                <span>{center.numberOfStores.toLocaleString()} stores</span>
              )}
              {center.squareFootage >= 100000 && (
                <span>{center.squareFootage.toLocaleString()} square feet</span>
              )}
              {center.openFrom && center.openUntil && (
                <span>
                  {timeOfDay(center.openFrom)} &mdash;{" "}
                  {timeOfDay(center.openUntil)}
                </span>
              )}
              {center.rating && center.rating >= 3 && (
                <span>
                  {clamp(center.rating, 1, 5).toFixed(1)}
                  {center.reviewCount && center.reviewCount >= 5 ? (
                    <> from {center.reviewCount.toLocaleString()} reviews</>
                  ) : (
                    " stars"
                  )}
                </span>
              )}
            </CenterStats>
          </li>
        ))}
      </ul>
    </main>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div
      className="inline-flex text-yellow-500"
      itemProp="ratingValue"
      itemType="https://schema.org/AggregateRating"
      title={rating.toFixed(1)}
    >
      {range(0, 5, 1).map((i) => (
        <StarIcon
          key={i}
          className="h-4 w-4"
          fill={i + 0.5 <= clamp(rating, 1, 5) ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

function CenterStats({ children }: { children: React.ReactNode }) {
  const visible = Children.toArray(children).filter((child) => !!child);
  return (
    <div className="flex flex-row gap-2 text-gray-500 text-sm">
      {visible.map((child, index) => (
        <Fragment key={index.toString()}>
          {child}
          {index < visible.length - 1 && <span>&bull;</span>}
        </Fragment>
      ))}
    </div>
  );
}

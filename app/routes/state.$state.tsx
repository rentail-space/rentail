import { clamp, meanBy, range } from "es-toolkit";
import { MapPinIcon, MoveLeftIcon, StarIcon } from "lucide-react";
import { Children, Fragment, useRef } from "react";
import { Link } from "react-router";
import { Streamdown } from "streamdown";
import CentersMap from "~/components/ui/CentersMap";
import prisma from "~/lib/prisma";
import timeOfDay from "~/lib/timeOfDay";
import type { Route } from "./+types/state.$state";

export async function loader({ params }: Route.LoaderArgs) {
  const state = await prisma.state.findUnique({
    where: { abbreviation: params.state.toUpperCase() },
  });
  if (!state) throw new Response("Not Found", { status: 404 });

  const centers = await prisma.property.findMany({
    include: {
      spaces: { where: { available: true } },
    },
    orderBy: { name: "asc" },
    where: { state: state.abbreviation },
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
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Server-generated data
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaData(loaderData)),
        }}
      />

      <div className="flex w-full items-center">
        <Link
          to="/states"
          className="hidden w-1/2 flex-row items-center gap-2 md:flex print:hidden"
        >
          <MoveLeftIcon className="h-4 w-4" />
          All States
        </Link>

        <h1 className="text-center font-bold text-2xl">{state.name}</h1>

        <span className="w-1/2" />
      </div>

      <Streamdown className="text-gray-600 text-sm" mode="static">
        {state.lede}
      </Streamdown>

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
        {centers.map((center, index) => (
          <li
            key={center.id}
            className="pb-4"
            itemScope
            itemType="https://schema.org/ListItem"
            itemProp="itemListElement"
          >
            <Link
              className="space-y-2 hover:*:text-blue-500"
              to={`/center/${center.id}`}
              itemProp="url"
            >
              <meta itemProp="position" content={String(index + 1)} />
              <h2
                className="flex flex-row items-center justify-between gap-2 font-bold text-xl"
                itemProp="name"
              >
                <span>{center.name}</span>
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
                  <span>
                    {center.squareFootage.toLocaleString()} square feet
                  </span>
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
            </Link>
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

function schemaData({
  centers,
  state,
}: {
  centers: Array<{
    id: string;
    name: string;
    city: string | null;
    state: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    rating: number | null;
    reviewCount: number | null;
    summary: string | null;
    squareFootage: number | null;
    numberOfStores: number | null;
  }>;
  state: { name: string; abbreviation: string };
}) {
  const itemListElements = centers.map((center, index) => {
    const item: Record<string, unknown> = {
      "@type": ["ListItem", "ShoppingCenter"],
      position: index + 1,
      name: `${center.name}, ${center.city}`,
      url: `https://rentail.space/center/${center.id}`,
    };

    if (center.summary) item.description = center.summary;

    if (center.address && center.city)
      item.address = {
        "@type": "PostalAddress",
        streetAddress: center.address,
        addressLocality: center.city,
        addressRegion: center.state,
        addressCountry: "US",
      };

    if (center.latitude && center.longitude)
      item.geo = {
        "@type": "GeoCoordinates",
        latitude: center.latitude,
        longitude: center.longitude,
      };

    if (center.rating && center.rating >= 3)
      item.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: clamp(center.rating, 1, 5),
        bestRating: 5,
        worstRating: 1,
        reviewCount: center.reviewCount,
      };

    return item;
  });

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Shopping Centers in ${state.abbreviation}`,
    description: `Complete list of shopping centers and retail spaces in ${state.name}`,
    numberOfItems: itemListElements.length,
    itemListElement: itemListElements,
  };
}

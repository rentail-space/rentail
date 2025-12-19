import { clamp, meanBy, range } from "es-toolkit";
import {
  ArrowRightIcon,
  MapPinIcon,
  MoveLeftIcon,
  StarIcon,
} from "lucide-react";
import type { PropertyGetPayload } from "prisma/generated/models";
import { Children, Fragment, useRef } from "react";
import { Link } from "react-router";
import { Streamdown } from "streamdown";
import { Button } from "~/components/ui/Button";
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
    <main className="container mx-auto my-10 space-y-8 p-5">
      <title>
        Shopping Centers in {state.name} - Specialty Leasing & Retail Spaces |
        Rentail.space
      </title>
      <meta
        name="description"
        content={`Find specialty leasing and short-term retail spaces in ${state.name}. Browse ${centers.length} shopping centers with kiosks, pop-up shops, carts, and temporary storefronts. Real-time availability for seasonal and temporary retail opportunities in ${state.abbreviation}.`}
      />
      <meta
        name="keywords"
        content={`${state.name} specialty leasing, ${state.abbreviation} kiosk rental, ${state.name} pop-up shops, ${state.abbreviation} mall carts, ${state.name} temporary retail, shopping centers in ${state.name}`}
      />

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
            <meta itemProp="position" content={String(index + 1)} />
            <LinkToCenter center={center} centerRef={centerRef} />
          </li>
        ))}
      </ul>
    </main>
  );
}

function LinkToCenter({
  center,
  centerRef,
}: {
  center: PropertyGetPayload<{ include: { spaces: true } }>;
  centerRef: React.RefObject<
    ((center: { longitude: number; latitude: number }) => void) | null
  >;
}) {
  return (
    <div className="space-y-2" itemProp="url">
      <div className="flex flex-row flex-nowrap items-center justify-between gap-4">
        <h2
          className="flex flex-row items-center justify-between gap-2 font-bold text-xl"
          itemProp="name"
        >
          <Link to={`/center/${center.id}`}>{center.name}</Link>
        </h2>
        <button
          type="button"
          className="flex cursor-pointer flex-row flex-nowrap items-center gap-2 text-gray-500 text-sm"
          title="Show center on map"
          onClick={(event) => {
            event.preventDefault();
            centerRef.current?.(center);
          }}
        >
          {center.city}
          <MapPinIcon className="h-6 w-6 text-blue-500" />
        </button>
      </div>

      <div className="flex flex-row flex-nowrap items-end justify-between gap-4">
        <Link to={`/center/${center.id}`} className="space-y-2">
          <p className="space-x-2">
            {center.rating && center.rating >= 3 && (
              <RatingStars rating={center.rating} />
            )}
            <span itemProp="description">{center.summary}</span>
          </p>
          <KeyCenterStats center={center} />
        </Link>

        <Button
          variant="secondary"
          className="flex flex-row flex-nowrap items-center gap-2"
          asChild
        >
          <Link to={`/center/${center.id}`}>
            See center
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span
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
    </span>
  );
}

function KeyCenterStats({
  center,
}: {
  center: PropertyGetPayload<{ include: { spaces: true } }>;
}) {
  return (
    <SplitCenterStats>
      {center.numberOfStores >= 30 && (
        <span className="whitespace-nowrap">
          {center.numberOfStores.toLocaleString()} stores
        </span>
      )}
      {center.squareFootage >= 100000 && (
        <span className="whitespace-nowrap">
          {center.squareFootage.toLocaleString()} square feet
        </span>
      )}
      {center.openFrom && center.openUntil && (
        <span className="whitespace-nowrap">
          {timeOfDay(center.openFrom)} &mdash; {timeOfDay(center.openUntil)}
        </span>
      )}
      {center.rating && center.rating >= 3 && (
        <span className="whitespace-nowrap">
          {clamp(center.rating, 1, 5).toFixed(1)}
          {center.reviewCount && center.reviewCount >= 5 ? (
            <> from {center.reviewCount.toLocaleString()} reviews</>
          ) : (
            " stars"
          )}
        </span>
      )}

      {center.spaces.length > 0 && (
        <span className="whitespace-nowrap">
          {center.spaces.length} available{" "}
          {center.spaces.length === 1 ? "space" : "spaces"}
        </span>
      )}
    </SplitCenterStats>
  );
}

function SplitCenterStats({ children }: { children: React.ReactNode[] }) {
  const visible = Children.toArray(children).filter((child) => !!child);
  return (
    <div className="flex flex-row flex-wrap gap-x-2 text-gray-500 text-sm">
      {children.map(
        (child, index) =>
          child && (
            <Fragment key={index.toString()}>
              {child}
              {index < visible.length - 1 && <span>&bull;</span>}
            </Fragment>
          ),
      )}
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

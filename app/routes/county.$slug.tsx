import { clamp, meanBy, range } from "es-toolkit";
import {
  ArrowRightIcon,
  MapPinIcon,
  MoveLeftIcon,
  StarHalfIcon,
  StarIcon,
} from "lucide-react";
import type { PropertyGetPayload } from "prisma/generated/models";
import { Fragment, useRef } from "react";
import { Link } from "react-router";
import { ActiveLink } from "~/components/ui/ActiveLink";
import { Button } from "~/components/ui/Button";
import CentersMap from "~/components/ui/CentersMap";
import pageMeta from "~/lib/pageMeta";
import prisma from "~/lib/prisma.server";
import timeOfDay from "~/lib/timeOfDay";
import { pluralize } from "~/lib/utils";
import type { Route } from "./+types/county.$slug";

export async function loader({ params }: Route.LoaderArgs) {
  const county = await prisma.county.findUnique({
    where: { slug: params.slug },
    include: {
      state: true,
      cities: { orderBy: { name: "asc" } },
    },
  });

  if (!county) throw new Response("Not Found", { status: 404 });

  const cityNames = county.cities.map((city) => city.name);

  const centers = await prisma.property.findMany({
    include: {
      spaces: { where: { available: true } },
      state: true,
    },
    orderBy: { name: "asc" },
    where: {
      city: { in: cityNames },
      stateAbbreviation: county.stateAbbreviation,
    },
  });

  return { centers, county };
}

export function meta({ data }: Route.MetaArgs): Route.MetaDescriptors {
  if (!data) return [];
  const { centers, county } = data;
  return pageMeta({
    title: `Shopping Centers in ${county.name}, ${county.state.abbreviation} | Rentail.space`,
    description: `Find specialty leasing and short-term retail spaces in ${county.name}, ${county.state.abbreviation}. Browse ${centers.length} shopping centers with kiosks, pop-up shops, carts, and temporary storefronts. Real-time availability for seasonal and temporary retail opportunities.`,
    url: `/county/${county.state.abbreviation.toLowerCase()}-${county.name.toLowerCase().replace(/\s+/g, "-")}`,
    keywords: `${county.name} specialty leasing, ${county.name} kiosk rental, ${county.name} pop-up shops, ${county.name} mall carts, ${county.name} temporary retail, shopping centers in ${county.name}`,
  });
}

export default function CountyPage({ loaderData }: Route.ComponentProps) {
  const centerRef =
    useRef<(center: { longitude: number; latitude: number }) => void>(null);
  const { centers, county } = loaderData;

  return (
    <main className="container mx-auto my-10 space-y-8 p-5">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Server-generated data
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaData(loaderData)),
        }}
      />

      <ActiveLink
        to={`/state/${county.state.abbreviation.toLowerCase()}`}
        variant="silent"
        className="hidden md:inline-flex print:hidden"
      >
        <MoveLeftIcon className="h-4 w-4" />
        {county.state.name}
      </ActiveLink>

      <h1 className="whitespace-nowrap text-center font-bold text-2xl">
        {county.name}, {county.state.abbreviation}
      </h1>

      <p className="text-center text-gray-600 text-lg">
        Lease your perfect space in {county.name}, {county.state.abbreviation}.
      </p>

      {centers.length > 0 && (
        <CentersMap
          centerRef={centerRef}
          centers={centers}
          latitude={meanBy(centers, (center) => center.latitude)}
          longitude={meanBy(centers, (center) => center.longitude)}
        />
      )}

      {centers.length === 0 ? (
        <p className="text-center text-gray-500">
          No shopping centers found in {county.name}.
        </p>
      ) : (
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
      )}

      {county.cities.length > 0 && (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {county.cities.map((city) => (
            <ActiveLink
              key={city.id}
              to={`/city/${city.slug}`}
              variant="silent"
              className="rounded border border-gray-300 p-3 hover:border-blue-500"
            >
              {city.name}
            </ActiveLink>
          ))}
        </div>
      )}
    </main>
  );
}

function LinkToCenter({
  center,
  centerRef,
}: {
  center: PropertyGetPayload<{ include: { spaces: true; state: true } }>;
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
        <Button
          variant="link"
          className="text-gray-500 text-sm"
          title="Show center on map"
          onClick={(event) => {
            event.preventDefault();
            centerRef.current?.(center);
          }}
        >
          {center.city}
          <MapPinIcon className="h-6 w-6 text-blue-500" />
        </Button>
      </div>

      <div className="flex flex-row flex-nowrap items-end justify-between gap-4">
        <Link to={`/center/${center.id}`} className="space-y-2">
          <p className="space-x-2">
            {center.rating && center.rating > 3 && (
              <RatingStars rating={center.rating} />
            )}
            <span itemProp="description">{center.summary}</span>
          </p>
          <KeyCenterStats center={center} />
        </Link>

        <ActiveLink to={`/center/${center.id}`} variant="button">
          Visit {center.name}
          <ArrowRightIcon className="h-4 w-4" />
        </ActiveLink>
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
      {range(0, 5, 1).map((i) =>
        rating >= i + 1 ? (
          <StarIcon key={i} className="h-4 w-4" fill="currentColor" />
        ) : rating >= i + 0.5 ? (
          <span key={i} className="relative inline-block h-4 w-4">
            <StarIcon className="absolute inset-0 h-4 w-4" strokeWidth={2} />
            <StarHalfIcon
              className="absolute inset-0 h-4 w-4"
              fill="currentColor"
            />
          </span>
        ) : (
          <StarIcon key={i} className="h-4 w-4" />
        ),
      )}
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
      {center.numberOfStores &&
        center.numberOfStores >= 30 &&
        `${center.numberOfStores.toLocaleString()} stores`}
      {center.squareFootage &&
        center.squareFootage >= 10_0000 &&
        `${center.squareFootage.toLocaleString()} square feet`}
      {center.openFrom === 0 && center.openUntil === 2400
        ? "24 hours"
        : center.openFrom && center.openUntil
          ? `${timeOfDay(center.openFrom)}—${timeOfDay(center.openUntil)}`
          : null}

      {center.reviewCount &&
        center.reviewCount >= 3 &&
        center.rating &&
        center.rating >= 3 &&
        pluralize(center.reviewCount, "review", "reviews")}

      {center.spaces.length > 0 &&
        pluralize(center.spaces.length, "available space", "available spaces")}
    </SplitCenterStats>
  );
}

function SplitCenterStats({ children }: { children: React.ReactNode[] }) {
  return (
    <div className="flex flex-row flex-wrap gap-x-2 text-gray-500 text-sm">
      {children.filter(Boolean).map(
        (child, index) =>
          child && (
            <Fragment key={index.toString()}>
              {index > 0 && <span>&bull; </span>}
              {child}
            </Fragment>
          ),
      )}
    </div>
  );
}

function schemaData({
  centers,
  county,
}: {
  centers: PropertyGetPayload<{ include: { spaces: true; state: true } }>[];
  county: {
    name: string;
    state: { name: string; abbreviation: string };
    stateAbbreviation: string;
  };
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
        addressRegion: center.state.abbreviation,
        addressCountry: center.state.country,
      };

    if (center.latitude && center.longitude)
      item.geo = {
        "@type": "GeoCoordinates",
        latitude: center.latitude,
        longitude: center.longitude,
      };

    if (center.rating && center.rating > 3)
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
    "@graph": [
      {
        "@type": "ItemList",
        name: `Shopping Centers in ${county.name}, ${county.state.abbreviation}`,
        description: `Complete list of shopping centers and retail spaces in ${county.name}, ${county.state.name}`,
        numberOfItems: itemListElements.length,
        itemListElement: itemListElements,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://rentail.space",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "States",
            item: "https://rentail.space/states",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: county.state.name,
            item: `https://rentail.space/state/${county.state.abbreviation.toLowerCase()}`,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: county.name,
            item: `https://rentail.space/county/${county.state.abbreviation.toLowerCase()}-${county.name.toLowerCase().replace(/\s+/g, "-")}`,
          },
        ],
      },
    ],
  };
}

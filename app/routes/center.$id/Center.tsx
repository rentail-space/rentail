import { clamp } from "es-toolkit";
import {
  ClockIcon,
  GlobeIcon,
  InfoIcon,
  MapPinIcon,
  PhoneIcon,
  RulerDimensionLineIcon,
  ShoppingCartIcon,
  StarIcon,
} from "lucide-react";
import type { PropertyGetPayload } from "prisma/generated/models";
import { Link } from "react-router";
import remarkGfm from "remark-gfm";
import { Streamdown } from "streamdown";
import { Button } from "~/components/ui/Button";
import CentersMap from "~/components/ui/CentersMap";
import formatPhoneNumber from "~/lib/formatPhoneNumber";
import { Spaces } from "./Spaces";

export default function Center({
  center,
}: {
  center: PropertyGetPayload<{ include: { spaces: true } }>;
}) {
  return (
    <div className="mx-auto my-10 flex max-w-4xl flex-col gap-6 px-4">
      <h1 className="font-bold text-4xl text-black">
        {center.website ? (
          <Link
            to={center.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block transform rounded-md border-2 border-black bg-[hsl(37,92%,65%)] px-6 py-3 font-bold text-black no-underline shadow-[6px_6px_0px_0px_black] transition-all duration-100 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_black]"
          >
            {center.name}
          </Link>
        ) : (
          <span className="inline-block rounded-md border-2 border-black bg-[hsl(37,92%,65%)] px-6 py-3 font-bold text-black shadow-[6px_6px_0px_0px_black]">
            {center.name}
          </span>
        )}
      </h1>

      <section className="rounded-md border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_black]">
        <CenterInfo center={center} />
      </section>

      {center.imageURLs.length > 0 && (
        <section className="overflow-hidden rounded-md border-2 border-black shadow-[6px_6px_0px_0px_black]">
          <img className="w-full" src={center.imageURLs[0]} alt={center.name} />
        </section>
      )}

      <section className="prose prose-lg max-w-none rounded-md border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_black]">
        <Streamdown remarkPlugins={[remarkGfm]} mode="static">
          {center.description}
        </Streamdown>
      </section>

      <section className="flex flex-col gap-4">
        <Spaces spaces={center.spaces} />
      </section>

      <section className="overflow-hidden rounded-md border-2 border-black shadow-[6px_6px_0px_0px_black]">
        <CentersMap
          centers={[center]}
          latitude={center.latitude ?? 0}
          longitude={center.longitude ?? 0}
        />
      </section>
    </div>
  );
}

function CenterInfo({
  center,
}: {
  center: PropertyGetPayload<{ include: { spaces: true } }>;
}) {
  return (
    <div className="space-y-6 divide-y divide-gray-200">
      {center.summary && (
        <div className="items-top flex flex-row gap-2 pb-4">
          <InfoIcon className="h-8 w-8" />
          <span>{center.summary}</span>
        </div>
      )}

      {center.rating && (
        <div className="items-top flex flex-row gap-2 pb-4">
          <StarIcon className="h-6 w-6 text-yellow-500" fill="currentColor" />
          <span>
            {clamp(center.rating / 10, 1, 5).toFixed(1)}
            {center.reviewCount &&
              ` from ${center.reviewCount.toLocaleString()} reviews`}
          </span>
        </div>
      )}

      {center.openUntil && (
        <div className="items-top flex flex-row gap-2 pb-4">
          <ClockIcon className="h-6 w-6" />
          <span>
            Open{" "}
            {center.openFrom && (
              <span>
                {clamp(center.openFrom / 100, 0, 23) % 12}:
                {clamp(center.openFrom % 100, 0, 59)
                  .toString()
                  .padStart(2, "0")}{" "}
                {clamp(center.openFrom / 100, 0, 23) > 12 ? "PM" : "AM"}
              </span>
            )}{" "}
            until {clamp(center.openUntil / 100, 0, 23) % 12}:
            {clamp(center.openUntil % 100, 0, 59)
              .toString()
              .padStart(2, "0")}{" "}
            {clamp(center.openUntil / 100, 0, 23) > 12 ? "PM" : "AM"}
          </span>
        </div>
      )}

      {center.squareFootage && (
        <div className="items-top flex flex-row gap-2 pb-4">
          <RulerDimensionLineIcon className="h-6 w-6" />
          <span>
            {center.squareFootage.toLocaleString(undefined, {
              style: "decimal",
            })}{" "}
            square feet
          </span>
        </div>
      )}

      {center.numberOfStores && (
        <div className="items-top flex flex-row gap-2 pb-4">
          <ShoppingCartIcon className="h-6 w-6" />
          <span>
            {center.numberOfStores.toLocaleString(undefined, {
              style: "decimal",
            })}{" "}
            stores
          </span>
        </div>
      )}

      {center.website && (
        <div className="items-top flex flex-row gap-2 pb-4">
          <GlobeIcon className="h-6 w-6" />
          <Link to={center.website} target="_blank" rel="noopener noreferrer">
            {center.website}
          </Link>
        </div>
      )}

      {center.phone && (
        <div className="items-top flex flex-row gap-2 pb-4">
          <PhoneIcon className="h-6 w-6" />
          <span>
            <a href={`tel:${center.phone}`}>
              {formatPhoneNumber(center.phone)}
            </a>
          </span>
        </div>
      )}

      <div className="space-y-4">
        <div className="items-top flex flex-row gap-2">
          <MapPinIcon className="h-6 w-6" />
          <span>
            {center.address}
            {center.city && `, ${center.city}`}
            {center.state && `, ${center.state}`}
          </span>
        </div>

        <Button
          className="text-blue-500 underline hover:decoration-[hsl(37,92%,65%)]"
          variant="secondary"
          asChild={true}
        >
          <Link
            to={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${center.address}, ${center.city}, ${center.state} ${center.country}`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Directions
          </Link>
        </Button>
      </div>
    </div>
  );
}

import { clamp } from "es-toolkit";
import {
  ClockIcon,
  GlobeIcon,
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
import { Spaces } from "./Spaces";

export default function Center({
  center,
}: {
  center: PropertyGetPayload<{ include: { spaces: true } }>;
}) {
  return (
    <div className="mx-auto my-10 flex max-w-4xl flex-col gap-6 px-4">
      <h1 className="font-bold text-4xl text-black">
        <Link
          to={center.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block transform rounded-md border-2 border-black bg-[hsl(37,92%,65%)] px-6 py-3 font-bold text-black no-underline shadow-[6px_6px_0px_0px_black] transition-all duration-100 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_black]"
        >
          {center.name}
        </Link>
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
          zoom={12}
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
    <div className="flex flex-col gap-4">
      {center.rating && (
        <div className="flex flex-row items-center gap-2">
          <StarIcon className="h-5 w-5 text-yellow-500" fill="currentColor" />
          {clamp(center.rating / 10, 1, 5).toFixed(1)} &bull; {center.summary}
        </div>
      )}

      {center.openUntil && (
        <div className="flex flex-row items-center gap-2">
          <ClockIcon className="h-5 w-5" />
          Open until {clamp(center.openUntil / 100, 0, 23) % 12}:
          {clamp(center.openUntil % 100, 0, 59)
            .toString()
            .padStart(2, "0")}{" "}
          {clamp(center.openUntil / 100, 0, 23) > 12 ? "PM" : "AM"}
        </div>
      )}

      {center.phone && (
        <div className="flex flex-row items-center gap-2">
          <PhoneIcon className="h-5 w-5" />
          <a href={`tel:${center.phone}`}>{center.phone}</a>
        </div>
      )}

      {center.squareFootage && (
        <div className="flex flex-row items-center gap-2">
          <RulerDimensionLineIcon className="h-5 w-5" />
          {center.squareFootage.toLocaleString(undefined, { style: "decimal" })}{" "}
          square feet
        </div>
      )}

      {center.numberOfStores && (
        <div className="flex flex-row items-center gap-2">
          <ShoppingCartIcon className="h-5 w-5" />
          {center.numberOfStores.toLocaleString(undefined, {
            style: "decimal",
          })}{" "}
          stores
        </div>
      )}

      <div className="flex flex-row items-center gap-2">
        <GlobeIcon className="h-5 w-5" />
        <Link to={center.website} target="_blank" rel="noopener noreferrer">
          {center.website}
        </Link>
      </div>

      <div className="flex flex-row items-center gap-2">
        <MapPinIcon className="h-5 w-5" />
        {center.address}
      </div>

      <div>
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

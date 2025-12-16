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
import { Button } from "~/components/ui/Button";
import formatPhoneNumber from "~/lib/formatPhoneNumber";
import timeOfDay from "~/lib/timeOfDay";

export default function CenterInfo({
  center,
}: {
  center: PropertyGetPayload<{ include: { spaces: true } }>;
}) {
  return (
    <div className="space-y-6 divide-y divide-gray-200">
      {center.summary && (
        <div className="items-top flex flex-row gap-2 pb-4">
          <span>{center.summary}</span>
        </div>
      )}

      {center.rating && (
        <div className="items-top flex flex-row gap-2 pb-4">
          <StarIcon className="h-6 w-6 text-yellow-500" fill="currentColor" />
          <span>
            {clamp(center.rating, 1, 5).toFixed(1)}
            {center.reviewCount &&
              ` from ${center.reviewCount.toLocaleString()} reviews`}
          </span>
        </div>
      )}

      {center.openFrom && center.openUntil && (
        <div className="items-top flex flex-row gap-2 pb-4">
          <ClockIcon className="h-6 w-6" />
          <span>
            Open {timeOfDay(center.openFrom)} until{" "}
            {timeOfDay(center.openUntil)}
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

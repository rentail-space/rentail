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
import { ActiveLink } from "~/components/ui/ActiveLink";
import { Card, CardContent } from "~/components/ui/Card";
import { trackEvent } from "~/lib/analytics";
import externalLink from "~/lib/externalLink";
import formatPhoneNumber from "~/lib/formatPhoneNumber";
import timeOfDay from "~/lib/timeOfDay";

export default function CenterAttributes({
  center,
}: {
  center: PropertyGetPayload<{ include: { spaces: true } }>;
}) {
  return (
    <Card className="bg-white">
      <CardContent className="space-y-6 divide-y divide-gray-200">
        {center.summary && (
          <div className="items-top flex flex-row gap-2 pb-4">
            <span>{center.summary}</span>
          </div>
        )}

        {center.rating && center.rating > 3 && (
          <div className="items-top flex flex-row gap-2 pb-4">
            <StarIcon className="h-6 w-6 text-yellow-500" fill="currentColor" />
            <span>
              {clamp(center.rating, 1, 5).toFixed(1)}
              {center.reviewCount &&
                ` from ${center.reviewCount.toLocaleString()} reviews`}
            </span>
          </div>
        )}

        {center.openFrom === 0 && center.openUntil === 2400 ? (
          <div className="items-top flex flex-row gap-2 pb-4">
            <ClockIcon className="h-6 w-6" />
            <span>Open 24 hours</span>
          </div>
        ) : (
          center.openFrom &&
          center.openUntil && (
            <div className="items-top flex flex-row gap-2 pb-4">
              <ClockIcon className="h-6 w-6" />
              <span>
                Open {timeOfDay(center.openFrom)} until{" "}
                {timeOfDay(center.openUntil)}
              </span>
            </div>
          )
        )}

        {center.squareFootage && center.squareFootage > 10_000 && (
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

        {center.numberOfStores && center.numberOfStores >= 20 && (
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
            <ActiveLink
              className="truncate"
              onClick={() =>
                trackEvent("click_external_link", { category: "center_info" })
              }
              target="_blank"
              to={externalLink(center.website)}
            >
              {new URL(center.website).hostname}
            </ActiveLink>
          </div>
        )}

        {center.phone && (
          <div className="items-top flex flex-row gap-2 pb-4">
            <PhoneIcon className="h-6 w-6" />
            <span>
              <ActiveLink
                onClick={() =>
                  trackEvent("click_phone_number", {
                    category: "center_info",
                  })
                }
                to={`tel:${center.phone}`}
              >
                {formatPhoneNumber(center.phone)}
              </ActiveLink>
            </span>
          </div>
        )}

        <div className="items-top flex flex-row gap-2">
          <MapPinIcon className="h-6 w-6" />

          <div className="flex w-full flex-row items-center justify-between gap-2">
            <span>
              {center.address}
              {center.city && `, ${center.city}`}
              {center.state && `, ${center.state}`}
            </span>

            <ActiveLink
              to={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${center.address}, ${center.city}, ${center.state} ${center.country}`,
              )}`}
              target="_blank"
            >
              Directions
            </ActiveLink>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

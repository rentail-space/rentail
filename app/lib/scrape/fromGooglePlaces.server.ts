/**
 * @see https://console.cloud.google.com/google/maps-apis/metrics?project=rentail-480516
 * @see https://console.cloud.google.com/billing/015C92-88EA69-E2A38C/reports?project=rentail-480516&organizationId=316438173672
 */

import { mkdir, writeFile } from "node:fs/promises";
import { trackApiCall } from "~/lib/apiUsageTracker";
import { existsSync } from "node:fs";
import { type Ora } from "ora";
import { daysAgo } from "~/lib/temporal";
import { slugify } from "~/lib/utils";
import { join } from "node:path";
import { map } from "radashi";
import invariant from "tiny-invariant";
import envVars from "~/lib/env";
import normalizePhone from "~/lib/normalizePhone";
import sharp from "sharp";
import zod from "zod";

if (!envVars.GOOGLE_PLACES_API_KEY)
  throw new Error("GOOGLE_PLACES_API_KEY is required (set it in .env)");

const placeDetailsSchema = zod.object({
  address: zod.string().describe("The place's address"),
  city: zod.string().describe("The place's city"),
  country: zod.string().describe("The place's country"),
  googlePlaceID: zod.string().describe("The place's Google Place ID"),
  imageURLs: zod.array(zod.string()).describe("The place's image URLs"),
  latitude: zod.number().describe("The place's latitude"),
  longitude: zod.number().describe("The place's longitude"),
  name: zod.string().describe("The place's name"),
  openFrom: zod.number().describe("The place's opening from").optional(),
  openUntil: zod.number().describe("The place's opening until").optional(),
  phone: zod.string().describe("The place's phone number").optional(),
  rating: zod.number().min(1).max(1).describe("The place's rating").optional(),
  reviewCount: zod.number().describe("The place's review count").optional(),
  state: zod.string().describe("The place's state"),
  summary: zod.string().describe("The place's summary").optional(),
  website: zod.string().describe("The place's website"),
});

/**
 * Fields to include in the find place request.
 */
const findPlaceFields = [
  "addressComponents",
  "businessStatus",
  "displayName",
  "editorialSummary",
  "internationalPhoneNumber",
  "location",
  "name",
  "photos",
  "primaryType",
  "rating",
  "regularOpeningHours",
  "userRatingCount",
  "websiteUri",
];

/**
 * Google Places API response type.
 */
type PlacesAPIPlace = {
  name: string; // eg "places/ChIJj61dQgK6j4AR4GeTYWZsKWw"
  addressComponents: Array<{
    longText: string;
    shortText: string;
    types: Array<
      | "street_number"
      | "route"
      | "locality"
      | "administrative_area_level_1"
      | "administrative_area_level_2"
      | "country"
      | "postal_code"
    >; // eg street_number=8500 route=Beverly Blvd locality=Los Angeles administrative_area_level_1=CA country=USA postal_code=90210
  }>;
  businessStatus:
    | "OPERATIONAL"
    | "CLOSED_TEMPORARILY"
    | "CLOSED_PERMANENTLY"
    | "UNKNOWN";
  displayName: {
    text: string; // eg "Beverly Center",
  };
  editorialSummary?: {
    text: string; // eg "High-end shopping mall offers luxury designer shops, well-known department stores & restaurants.",
  };
  internationalPhoneNumber: string; // eg. "+1 310-854-0070",
  location: {
    latitude: number;
    longitude: number;
  };
  photos?: Array<{
    name: string; // eg "places/ChIJj61dQgK6j4AR4GeTYWZsKWw/photos/AdDdOWpS8aBFPEm6GtQQhK6w"
    widthPx: number; // eg 1000,
    heightPx: number; // eg 1000,
    googleMapsUri: string; // eg "https://www.google.com/maps/place/?cid=1234567890",
  }>;
  primaryType: "shopping_mall" | "establishment";
  rating?: number; // eg 4.3
  regularOpeningHours?: {
    periods: Array<{
      open: {
        day: number; // 0-6, 0=Sunday, 1=Monday, etc
        hour: number;
        minute: number;
      };
      close: {
        day: number; // 0-6, 0=Sunday, 1=Monday, etc
        hour: number;
        minute: number;
      };
    }>;
  };
  userRatingCount?: number; // eg 12500
  websiteUri?: string; // eg "https://baystreetemeryville.com"
};

/**
 * Search for shopping centers near a location with caching
 *
 * @param point Center point
 * @param radiusMeters Search radius in meters (max 50,000)
 * @param spinner Spinner to update the progress
 * @returns Array of shopping centers near the location
 */
export async function nearbySearch({
  point,
  radiusMeters,
  spinner,
}: {
  point: { lat: number; lng: number };
  radiusMeters: number;
  spinner: Ora;
}): Promise<zod.infer<typeof placeDetailsSchema>[]> {
  const location = `${point.lat.toFixed(3)},${point.lng.toFixed(3)}`;
  spinner.text = `Searching for shopping centers near ${location}`;

  // Call API with retry logic
  const { data } = await searchNearbyRaw({ point, radiusMeters });
  const structured = await map(data, prepareSave);

  spinner.text = `Found ${structured.length} centers near ${location}`;
  return structured;
}

/**
 * Search for shopping malls near a location using Google Places Nearby Search API
 *
 * @param point Center point (latitude, longitude)
 * @param radiusMeters Search radius in meters (max 50,000)
 * @returns Array of places found (up to 20 results, no pagination support)
 */
async function searchNearbyRaw({
  point,
  radiusMeters,
}: {
  point: { lat: number; lng: number };
  radiusMeters: number;
}): Promise<{
  data: PlacesAPIPlace[];
  createdAt: Date;
}> {
  return await trackApiCall(
    {
      service: "google-places",
      endpoint: "nearby-search",
      defaultValue: [],
      newerThan: daysAgo(30),
      key: `nearby-search:${point.lat.toFixed(3)},${point.lng.toFixed(3)}`,
    },
    async () => {
      const response = await fetch(
        "https://places.googleapis.com/v1/places:searchNearby",
        {
          method: "POST",
          body: JSON.stringify({
            includedTypes: ["shopping_mall"],
            maxResultCount: 20,
            locationRestriction: {
              circle: {
                center: {
                  latitude: point.lat,
                  longitude: point.lng,
                },
                radius: radiusMeters,
              },
            },
          }),
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "rentail.space/1.0 (support@rentail.space)",
            "X-Goog-Api-Key": envVars.GOOGLE_PLACES_API_KEY,
            "X-Goog-FieldMask": findPlaceFields
              .map((field) => `places.${field}`)
              .join(","),
          },
        },
      );
      invariant(response.ok, "Nearby search failed");

      const { places } = (await response.json()) as {
        places?: PlacesAPIPlace[];
      };
      // Filter to operational shopping malls only
      return (places ?? []).filter(
        (place) =>
          place.primaryType === "shopping_mall" &&
          place.businessStatus === "OPERATIONAL" &&
          place.websiteUri,
      );
    },
  );
}

/**
 * Convert a Google Places API place to a place details schema.
 *
 * @param place Google Places API place details
 * @returns Place details schema
 */
async function prepareSave(
  place: PlacesAPIPlace,
): Promise<zod.infer<typeof placeDetailsSchema>> {
  const address = [
    // eg "8500 Beverly Blvd"
    longText(place.addressComponents, "street_number"),
    longText(place.addressComponents, "route"),
  ]
    .filter(Boolean)
    .join(" ");
  const city = [
    // eg "Bronx, New York"
    longText(place.addressComponents, "sublocality"),
    longText(place.addressComponents, "locality"),
  ]
    .filter(Boolean)
    .join(", ");
  const state = shortText(
    place.addressComponents,
    "administrative_area_level_1",
  );
  const country = shortText(place.addressComponents, "country");
  const displayName = place.displayName.text;
  const slug = slugify(state, displayName);
  const imageURLs = place.photos
    ? await downloadPhotos({ slug, photos: place.photos })
    : [];
  const { openFrom, openUntil } = operatingHours(place.regularOpeningHours);
  invariant(place.websiteUri, "Google Places data missing website");
  invariant(place.location?.latitude, "Google Places data missing latitude");
  invariant(place.location?.longitude, "Google Places data missing longitude");

  return {
    address,
    city,
    country,
    googlePlaceID: place.name,
    name: displayName,
    state,
    latitude: place.location.latitude,
    longitude: place.location.longitude,
    phone: normalizePhone(place.internationalPhoneNumber),
    imageURLs,
    summary: place.editorialSummary?.text,
    openFrom,
    openUntil,
    rating: place.rating,
    reviewCount: place.userRatingCount,
    website: place.websiteUri,
  };
}

/**
 * Download photos from Google Places API. We only download the high resolution
 * photos that are at least 600x500 pixels. Since the Places API charges for
 * usage, we only download the first photo.
 *
 * Images are automatically:
 * - Resized to max 1024px width (if wider)
 * - Compressed to JPEG format with high quality (90%)
 *
 * @param photos Photos to download
 * @param slug Slug for the mall
 * @returns Array of image URLs
 *
 * @see https://developers.google.com/maps/billing-and-pricing/pricing#places-legacy-pricing
 */
async function downloadPhotos({
  photos,
  slug,
}: {
  photos: Array<{ name: string; widthPx: number; heightPx: number }>;
  slug: string;
}): Promise<string[]> {
  const imageURLs: string[] = [];

  // NOTE: Photo download is expensive, so we're starting with just one photo,
  // and only picking the high resolution photos.
  const download = photos
    .filter((photo) => photo.widthPx > 600 && photo.heightPx > 500)
    .slice(0, 1);

  for (let index = 0; index < download.length; index++) {
    const photo = download[index];

    // Save with naming convention: {state}-{slug}-{index}.jpg
    const filename = `${slug}-${index + 1}.jpg`;
    const filepath = join("public", "images", "malls", filename);
    if (existsSync(filepath)) {
      imageURLs.push(`/images/malls/${filename}`);
      continue;
    }

    try {
      const { data: buffer } = await trackApiCall(
        {
          service: "google-places",
          endpoint: "photo",
          defaultValue: null,
          newerThan: daysAgo(10),
          key: `photo:${photo.name}:${photo.widthPx}x${photo.heightPx}`,
        },
        async () => {
          const url = new URL(
            `https://places.googleapis.com/v1/${photo.name}/media`,
          );
          url.searchParams.set("max_height_px", photo.heightPx.toString());
          url.searchParams.set("max_width_px", photo.widthPx.toString());
          // Fetch photo to detect format
          const response = await fetch(url, {
            headers: {
              "User-Agent": "rentail.space/1.0 (support@rentail.space)",
              "X-Goog-Api-Key": envVars.GOOGLE_PLACES_API_KEY,
            },
          });
          invariant(response.ok, "Failed to download photo");
          return Buffer.from(await response.arrayBuffer());
        },
      );
      if (!buffer) continue;

      // Process image: resize if needed and compress
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Resize if wider than 1024px
      let processed = image;
      if (metadata.width && metadata.width > 1024) {
        processed = processed.resize(1024, null, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      // Convert to JPEG with high quality compression
      const compressed = await processed
        .jpeg({ quality: 90, mozjpeg: true })
        .toBuffer();

      // Save image to file
      await mkdir(join(filepath, ".."), { recursive: true });
      await writeFile(filepath, compressed);

      imageURLs.push(`/images/malls/${filename}`);
    } catch (error) {
      console.error("Failed to download photo: %s", photo.name, error);
    }
  }
  return imageURLs;
}

/**
 * For some address components we want the long text (eg street address, city).
 *
 * @param addressComponents Array of address components
 * @param type Type of address component to get the long text for
 * @returns Long text of the address component
 */
function longText(
  addressComponents: Array<{ types?: string[]; longText: string }>,
  type: string,
): string {
  const component = addressComponents.find(({ types }) =>
    types?.includes(type),
  );
  return component?.longText ?? "";
}

/**
 * For some address components we want the short text (eg state, country).
 *
 * @param addressComponents Array of address components
 * @param type Type of address component to get the short text for
 * @returns Short text of the address component
 */
function shortText(
  addressComponents: Array<{ types?: string[]; shortText: string }>,
  type: string,
): string {
  const component = addressComponents.find(({ types }) =>
    types?.includes(type),
  );
  return component?.shortText ?? "";
}

/**
 * Get the operating hours from the regular opening hours. We pick the earliest
 * opening time and latest closing time across all days of the week.
 *
 * @param regularOpeningHours Regular opening hours
 * @returns Operating hours
 *   - openFrom: The hour and minute the mall opens (0-2359)
 *   - openUntil: The hour and minute the mall closes (0-2359)
 */
function operatingHours(regularOpeningHours?: {
  periods: Array<{
    open: { day: number; hour: number; minute: number };
    close: { day: number; hour: number; minute: number };
  }>;
}): { openFrom?: number; openUntil?: number } {
  const periods = regularOpeningHours?.periods.filter(
    (period) => period.open && period.close,
  );
  if (!periods) return {};

  const openFrom = Math.min(
    ...periods.map((period) => period.open.hour * 100 + period.open.minute),
  );
  const openUntil = Math.max(
    ...periods.map((period) => period.close.hour * 100 + period.close.minute),
  );
  // Note: if center is open 24 hours, we get Infinity/Infinity, so we default
  // to 0-2400.
  return Number.isFinite(openFrom) && Number.isFinite(openUntil)
    ? { openFrom, openUntil }
    : { openFrom: 0, openUntil: 2400 };
}

/**
 * https://console.cloud.google.com/google/maps-apis/metrics?project=rentail-480516
 */

import { invariant } from "es-toolkit";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import ora from "ora";
import zod from "zod";
import envVars from "../env";
import prisma from "../prisma";

if (!envVars.GOOGLE_PLACES_API_KEY)
  throw new Error("Use doppler run --config prd -- ");

const placeDetailsSchema = zod.object({
  address: zod.string().describe("The place's address"),
  city: zod.string().describe("The place's city"),
  country: zod.string().describe("The place's country"),
  imageURLs: zod.array(zod.string()).describe("The place's image URLs"),
  latitude: zod.number().describe("The place's latitude"),
  longitude: zod.number().describe("The place's longitude"),
  name: zod.string().describe("The place's name"),
  openFrom: zod.number().describe("The place's opening from").optional(),
  openUntil: zod.number().describe("The place's opening until").optional(),
  phone: zod.string().describe("The place's phone number").optional(),
  rating: zod.number().describe("The place's rating").optional(),
  reviewCount: zod.number().describe("The place's review count").optional(),
  state: zod.string().describe("The place's state"),
  summary: zod.string().describe("The place's summary").optional(),
  website: zod.string().describe("The place's website"),
});

/**
 * Get place details from Google Places API. The Places API charges for usage,
 * so this function uses database caching to avoid redundant API calls.
 *
 * @param placeName Name of the place to search for
 * @param placeID ID of the place to get details for (if available)
 * @returns Place details, or undefined if the place is not found or not operational
 */
export async function fromGooglePlaces({
  placeName,
  placeID,
}: {
  placeName: string;
  placeID?: string;
}): Promise<zod.infer<typeof placeDetailsSchema> | undefined> {
  const spinner = ora(`Fetching Google Places data for ${placeName}`).start();
  try {
    // eg "google-places:beverly-center"
    const key = `google-places:${placeName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")}`;

    const cache = await prisma.cache.findUnique({ where: { key } });
    if (cache) {
      const place = placeDetailsSchema.parse(cache.value);
      spinner.succeed();
      return place;
    }

    const place = placeID
      ? await getPlaceDetails({ placeName, placeID })
      : await searchText(placeName);
    await prisma.cache.create({ data: { key, value: place ?? "" } });
    spinner.succeed();
    return place;
  } catch (error) {
    spinner.fail(
      `Failed to fetch ${placeName} details from Google Places: ${error}`,
    );
    throw error;
  }
}

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
  photos: Array<{
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
 * Find a place by name using the Google Places API.
 *
 * @param placeName Name of the place to search for
 * @returns Place details, or undefined if the place is not found or not operational
 */
async function searchText(
  placeName: string,
): Promise<zod.infer<typeof placeDetailsSchema> | undefined> {
  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      body: JSON.stringify({
        includedType: "shopping_mall",
        includePureServiceAreaBusinesses: false,
        maxResultCount: 3,
        textQuery: placeName,
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
  invariant(response.ok, "Failed to find place");

  const { places } = (await response.json()) as { places?: PlacesAPIPlace[] };
  invariant(places, "No places found");

  const place = places.filter((place) =>
    similarNames(place.displayName.text, placeName),
  )[0];
  invariant(
    place.primaryType === "shopping_mall",
    "Place is not a shopping mall",
  );
  invariant(place.businessStatus === "OPERATIONAL", "Place is not operational");
  return await toDatabasePlace(placeName, places[0]);
}

/**
 * Get place details from Google Places API.
 *
 * @param placeName Name of the place to get details for
 * @param placeID ID of the place to get details for
 * @returns Place details, or undefined if the place is not found or not operational
 */
async function getPlaceDetails({
  placeName,
  placeID,
}: {
  placeName: string;
  placeID: string;
}): Promise<zod.infer<typeof placeDetailsSchema>> {
  const response = await fetch(`https://places.googleapis.com/v1/${placeID}`, {
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "rentail.space/1.0 (support@rentail.space)",
      "X-Goog-Api-Key": envVars.GOOGLE_PLACES_API_KEY,
      "X-Goog-FieldMask": findPlaceFields.join(","),
    },
  });
  invariant(response.ok, "Failed to get place details");
  const place = (await response.json()) as PlacesAPIPlace;
  return await toDatabasePlace(placeName, place);
}

/**
 * Convert a Google Places API place to a database place.
 *
 * @param placeDetails Google Places API place details
 * @returns Place details
 */
async function toDatabasePlace(
  placeName: string,
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
  const slug = createSlug({ state, placeName });
  const imageURLs = await downloadPhotos({ slug, photos: place.photos });
  const { openFrom, openUntil } = operatingHours(place.regularOpeningHours);
  invariant(place.websiteUri, "Google Places data missing website");
  invariant(place.location?.latitude, "Google Places data missing latitude");
  invariant(place.location?.longitude, "Google Places data missing longitude");

  return {
    name: placeName,
    address,
    city,
    state,
    country,
    latitude: place.location.latitude,
    longitude: place.location.longitude,
    phone: place.internationalPhoneNumber
      ? `+${place.internationalPhoneNumber.replace(/D/g, "")}`
      : undefined,
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
 * @see https://developers.google.com/maps/billing-and-pricing/pricing#places-legacy-pricing
 * @param slug Slug for the mall
 * @param photos Photos to download
 * @returns Array of image URLs
 */
async function downloadPhotos({
  slug,
  photos,
}: {
  slug: string;
  photos: Array<{ name: string; widthPx: number; heightPx: number }>;
}): Promise<string[]> {
  const imageURLs: string[] = [];
  // NOTE: Photo download is expensive, so we're starting with just one photo,
  // and only picking the high resolution photos.
  const download = photos
    .filter((photo) => photo.widthPx > 600 && photo.heightPx > 500)
    .slice(0, 1);

  for (let index = 0; index < download.length; index++) {
    const photo = download[index];
    try {
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

      // Detect format from content-type
      const contentType = response.headers.get("content-type") || "";
      const format = contentType.includes("png") ? "png" : "jpg";

      // Save with naming convention: {state}-{slug}-{index}.{format}
      const filename = `${slug}-${index + 1}.${format}`;
      const filepath = join("public", "images", "malls", filename);

      const buffer = Buffer.from(await response.arrayBuffer());
      await mkdir(join(filepath, ".."), { recursive: true });
      await writeFile(filepath, buffer);

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
  addressComponents: Array<{ types: string[]; longText: string }>,
  type: string,
): string {
  const component = addressComponents.find(({ types }) => types.includes(type));
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
  addressComponents: Array<{ types: string[]; shortText: string }>,
  type: string,
): string {
  const component = addressComponents.find(({ types }) => types.includes(type));
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
    ...periods.map((period) => {
      return period.open.hour * 100 + period.open.minute;
    }),
  );
  const openUntil = Math.max(
    ...periods.map((period) => {
      return period.close.hour * 100 + period.close.minute;
    }),
  );
  // Note: if center is open 24 hours, we get Infinity/Infinity, so we default
  // to 0-2400.
  return Number.isFinite(openFrom) && Number.isFinite(openUntil)
    ? { openFrom, openUntil }
    : { openFrom: 0, openUntil: 2400 };
}

/**
 * Create a slug for the mall. This takes the form of {state}-{name}, eg
 * "ca-beverly-center". We use the slug to store images in the
 * public/images/malls directory.
 *
 * @param state State of the mall
 * @param placeName Name of the mall
 * @returns Slug for the mall
 */
function createSlug({
  state,
  placeName,
}: {
  state: string;
  placeName: string;
}): string {
  return `${state.toLowerCase()}-${
    placeName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
      .replace(/\s+/g, "-") // Spaces to hyphens
      .replace(/-+/g, "-") // Collapse multiple hyphens
      .replace(/^-|-$/g, "") // Trim hyphens
  }`;
}

/**
 * Returns true if the two shopping center names are similar enough to be
 * considered a match.  Ignores case, punctuation, "&" vs "and", and trims
 * whitespace/dashes.  Handles things like "The Beverly Center" vs "Beverly
 * Center", etc.
 */
function similarNames(displayName: string, placeName: string): boolean {
  function normalize(str: string): string {
    return str
      .toLowerCase()
      .replace(/\b(the|mall|shopping center|plaza|shops|at|of|on)\b/g, "")
      .replace(/[&]/g, "and")
      .replace(/[^a-z0-9]+/g, " ") // Replace non-alphanum with space
      .replace(/\s+/g, " ") // Collapse whitespace
      .trim();
  }

  const normA = normalize(displayName);
  const normB = normalize(placeName);

  // Direct match or one contains the other
  if (normA === normB) return true;
  if (normA.includes(normB) || normB.includes(normA)) return true;

  // If both are reasonably long, require 80% overlap of words
  const wordsA = normA.split(" ");
  const wordsB = normB.split(" ");
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);
  const intersection = [...setA].filter((w) => setB.has(w));

  const overlapA = intersection.length / wordsA.length;
  const overlapB = intersection.length / wordsB.length;
  if (overlapA >= 0.8 || overlapB >= 0.8) return true;

  return false;
}

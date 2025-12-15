import { invariant } from "es-toolkit";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import ora from "ora";
import envVars from "../env";
import prisma from "../prisma";

/**
 * Get place details from Google Places API. The Places API charges for usage,
 * so this function uses database caching to avoid redundant API calls.
 *
 * @param placeName Name of the place to search for
 * @returns Place details, or undefined if the place is not found or not operational
 */
export async function fromGooglePlaces(placeName: string): Promise<
  | {
      address: string;
      city: string;
      country: string;
      imageURLs: string[];
      latitude: number;
      longitude: number;
      name: string;
      openFrom?: number;
      openUntil?: number;
      phone: string | undefined;
      photos: Array<{ name: string; widthPx: number; heightPx: number }>;
      rating?: number;
      reviewCount?: number;
      state: string;
      summary?: string;
      website: string;
    }
  | undefined
> {
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
      spinner.succeed();
      return cache.value as Awaited<ReturnType<typeof fromGooglePlaces>>;
    }

    const data = await fromPlacesAPI(placeName);
    await prisma.cache.create({ data: { key, value: data ?? "" } });
    spinner.succeed();
    return data;
  } catch (error) {
    spinner.fail(
      `Failed to fetch ${placeName} details from Google Places: ${error}`,
    );
    return undefined;
  }
}

/**
 * Get place details from Google Places API. This is the main function that
 * fetches the place details from the Places API.
 *
 * @param placeName Name of the place to search for
 * @returns Place details, or undefined if the place is not found or not operational
 * @see https://developers.google.com/maps/documentation/places/web-service/text-search
 * @see https://developers.google.com/maps/billing-and-pricing/pricing#places-legacy-pricing
 */
async function fromPlacesAPI(
  placeName: string,
): Promise<Awaited<ReturnType<typeof fromGooglePlaces>> | undefined> {
  const fieldMask = [
    "places.addressComponents",
    "places.businessStatus",
    "places.displayName",
    "places.editorialSummary",
    "places.internationalPhoneNumber",
    "places.location",
    "places.name",
    "places.photos",
    "places.primaryType,places.editorialSummary",
    "places.primaryType",
    "places.rating",
    "places.regularOpeningHours",
    "places.userRatingCount",
    "places.websiteUri",
  ].join(",");
  const url = new URL("https://places.googleapis.com/v1/places:searchText");

  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      textQuery: `Shopping center: "${placeName}"`,
      includePureServiceAreaBusinesses: false,
    }),
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "rentail.space/1.0 (support@rentail.space)",
      "X-Goog-Api-Key": envVars.GOOGLE_PLACES_API_KEY,
      "X-Goog-FieldMask": fieldMask,
    },
  });
  const data = (await response.json()) as {
    places: Array<{
      name: string; // eg "Beverly Center",
      internationalPhoneNumber: string; // eg. "+1 310-854-0070",
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
      location: {
        latitude: number;
        longitude: number;
      };
      rating?: number; // eg 4.3
      websiteUri?: string; // eg "https://www.beverlycenter.com/?utm_source=GoogleMyBusiness&utm_medium=organic&utm_campaign=GMB"
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
      businessStatus:
        | "OPERATIONAL"
        | "CLOSED_TEMPORARILY"
        | "CLOSED_PERMANENTLY"
        | "UNKNOWN";
      userRatingCount?: number; // eg 12500
      displayName: {
        text: string; // eg "Beverly Center",
      };
      primaryType: "shopping_mall" | "establishment";
      editorialSummary?: {
        text: string; // eg "High-end shopping mall offers luxury designer shops, well-known department stores & restaurants.",
      };
      photos: Array<{
        name: string; // eg "places/ChIJj61dQgK6j4AR4GeTYWZsKWw/photos/AdDdOWpS8aBFPEm6GtQQhK6w"
        widthPx: number; // eg 1000,
        heightPx: number; // eg 1000,
        googleMapsUri: string; // eg "https://www.google.com/maps/place/?cid=1234567890",
      }>;
    }>;
  };

  const places = data.places.filter(
    (place) => place.primaryType === "shopping_mall",
  );
  invariant(
    places.length === 1,
    `Multiple or no places found for ${placeName}`,
  );
  const place = places[0];

  invariant(
    place.businessStatus === "OPERATIONAL",
    `Place ${placeName} is not operational`,
  );
  invariant(place.websiteUri, `Place ${placeName} has no website URI`);

  const state = shortText(
    place.addressComponents,
    "administrative_area_level_1",
  );
  const slug = createSlug({ state, name: place.displayName.text });
  const imageURLs = await downloadPhotos({ slug, photos: place.photos });

  const { openFrom, openUntil } = operatingHours(place.regularOpeningHours);

  return {
    name: place.displayName.text,
    address: [
      longText(place.addressComponents, "street_number"),
      longText(place.addressComponents, "route"),
    ]
      .filter(Boolean)
      .join(" "),
    city: longText(place.addressComponents, "locality"),
    state,
    country: shortText(place.addressComponents, "country"),
    latitude: place.location.latitude,
    longitude: place.location.longitude,
    website: new URL("/", place.websiteUri).toString(),
    phone:
      place.internationalPhoneNumber &&
      `+${place.internationalPhoneNumber.replace(/\D/g, "")}`,
    photos: place.photos,
    imageURLs,
    summary: place.editorialSummary?.text,
    openFrom,
    openUntil,
    rating: place.rating,
    reviewCount: place.userRatingCount,
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
      // Fetch photo to detect format
      const url = new URL(
        `https://places.googleapis.com/v1/${photo.name}/media`,
      );
      url.searchParams.set("key", envVars.GOOGLE_PLACES_API_KEY);
      url.searchParams.set("maxHeightPx", "4800");
      url.searchParams.set("maxWidthPx", "4800");

      console.log("Downloading photo: %s", url);

      const response = await fetch(url);
      console.log("Response: %s", response.status);
      if (!response.ok) continue;

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
  return (
    addressComponents.find(({ types }) => types.includes(type))?.longText ?? ""
  );
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
  return (
    addressComponents.find(({ types }) => types.includes(type))?.shortText ?? ""
  );
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
  return {
    openFrom:
      regularOpeningHours &&
      Math.min(
        ...regularOpeningHours.periods.map((period) => {
          return period.open.hour * 100 + period.open.minute;
        }),
      ),
    openUntil:
      regularOpeningHours &&
      Math.max(
        ...regularOpeningHours.periods.map((period) => {
          return period.close.hour * 100 + period.close.minute;
        }),
      ),
  };
}

/**
 * Create a slug for the mall. This takes the form of {state}-{name}, eg
 * "ca-beverly-center". We use the slug to store images in the
 * public/images/malls directory.
 *
 * @param state State of the mall
 * @param name Name of the mall
 * @returns Slug for the mall
 */
function createSlug({ state, name }: { state: string; name: string }): string {
  return `${state.toLowerCase()}-${
    name
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
function areNamesSimilar(text: string, placeName: string): boolean {
  function normalize(str: string): string {
    return str
      .toLowerCase()
      .replace(/\b(the|mall|shopping center|plaza|shops|at|of|on)\b/g, "")
      .replace(/[&]/g, "and")
      .replace(/[^a-z0-9]+/g, " ") // Replace non-alphanum with space
      .replace(/\s+/g, " ") // Collapse whitespace
      .trim();
  }

  const normA = normalize(text);
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

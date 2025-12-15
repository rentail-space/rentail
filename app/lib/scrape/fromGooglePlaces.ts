import { invariant, maxBy, minBy } from "es-toolkit";
import envVars from "../env";
import prisma from "../prisma";

console.log(await fromGooglePlaces("Beverly Center"));

type PlaceInfo = {
  name: string;
  city: string;
  state: string;
  country: string;
  address: string;
  latitude: number;
  longitude: number;
  website: string | undefined;
  phone: string | undefined;
  imageURLs: string[];
  summary?: string;
  openFrom?: number;
  openUntil?: number;
  rating?: number;
  reviewCount?: number;
};

async function fromGooglePlaces(placeName: string): Promise<PlaceInfo> {
  const key = `google-places:${placeName.toLowerCase().replace(/[^a-z0-9\s-]/g, "")}`;
  const cache = await prisma.cache.findUnique({ where: { key } });
  if (cache) return cache.value as PlaceInfo;

  const data = await fromPlacesAPI(placeName);
  await prisma.cache.create({ data: { key, value: data } });
  return data;
}

/**
 * Get place details from Google Places API.
 *
 * @see  https://developers.google.com/maps/documentation/places/web-service/text-search
 */
async function fromPlacesAPI(placeName: string): Promise<PlaceInfo> {
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
      textQuery: placeName,
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
        widthPx: number; // eg 1000,
        heightPx: number; // eg 1000,
        googleMapsUri: string; // eg "https://www.google.com/maps/place/?cid=1234567890",
      }>;
    }>;
  };

  const place = data.places[0];
  invariant(place, "No place found");
  invariant(place.businessStatus === "OPERATIONAL", "Place is not operational");
  invariant(
    place.primaryType === "shopping_mall",
    "Place is not a shopping mall",
  );

  const openFrom =
    place.regularOpeningHours &&
    minBy(
      place.regularOpeningHours.periods,
      (period) => period.open.hour * 100 + period.open.minute,
    );
  const openUntil =
    place.regularOpeningHours &&
    maxBy(
      place.regularOpeningHours.periods,
      (period) => period.close.hour * 100 + period.close.minute,
    );

  return {
    name: place.displayName.text,
    address: [
      longText(place.addressComponents, "street_number"),
      longText(place.addressComponents, "route"),
    ]
      .filter(Boolean)
      .join(" "),
    city: longText(place.addressComponents, "locality"),
    state: shortText(place.addressComponents, "administrative_area_level_1"),
    country: shortText(place.addressComponents, "country"),
    latitude: place.location.latitude,
    longitude: place.location.longitude,
    website: new URL("/", place.websiteUri).toString(),
    phone:
      place.internationalPhoneNumber &&
      `+${place.internationalPhoneNumber.replace(/\D/g, "")}`,
    imageURLs: place.photos
      .filter((photo) => photo.widthPx > 600 && photo.heightPx > 500)
      .map((photo) => photo.googleMapsUri),
    summary: place.editorialSummary?.text,
    openFrom: openFrom
      ? openFrom.open.hour * 100 + openFrom.open.minute
      : undefined,
    openUntil: openUntil
      ? openUntil.close.hour * 100 + openUntil.close.minute
      : undefined,
    rating: place.rating,
    reviewCount: place.userRatingCount,
  };
}

function longText(
  addressComponents: Array<{ types: string[]; longText: string }>,
  type: string,
): string {
  return (
    addressComponents.find(({ types }) => types.includes(type))?.longText ?? ""
  );
}

function shortText(
  addressComponents: Array<{ types: string[]; shortText: string }>,
  type: string,
): string {
  return (
    addressComponents.find(({ types }) => types.includes(type))?.shortText ?? ""
  );
}

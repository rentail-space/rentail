import type { PropertyGetPayload } from "prisma/generated/models";
import externalLink from "~/lib/externalLink";
import prisma from "~/lib/prisma.server";
import type { Route } from "./+types/route";
import CenterDetails from "./CenterDetails";

export async function loader({ params }: Route.LoaderArgs) {
  const center = await prisma.property.findUnique({
    include: { spaces: { where: { available: true } }, state: true },
    where: { id: params.id },
  });
  if (!center) throw new Response("Not Found", { status: 404 });
  return center;
}

export default function CenterPage({
  loaderData: center,
}: Route.ComponentProps) {
  return (
    <main className="container mx-auto my-10 space-y-8 p-5">
      <title>
        {`${center.name} - ${center.city}, ${center.state.abbreviation} | Rentail.space`}
      </title>
      <meta
        name="description"
        content={
          center.summary
            ? `${center.summary} Located at ${center.address}, ${center.city}, ${center.state.abbreviation}.`
            : `Shopping center at ${center.address}, ${center.city}, ${center.state.abbreviation}`
        }
      />
      <meta
        name="keywords"
        content={`${center.name}, ${center.city} ${center.state.abbreviation}, shopping center, specialty leasing, kiosk rental, pop-up shop, temporary retail, mall leasing`}
      />
      <meta name="author" content="rentail.space" />
      <meta
        property="og:title"
        content={`${center.name} - ${center.city}, ${center.state.abbreviation} | Rentail.space`}
      />
      <meta
        property="og:description"
        content={
          center.summary
            ? `${center.summary} Located at ${center.address}, ${center.city}, ${center.state.abbreviation}.`
            : `Shopping center at ${center.address}, ${center.city}, ${center.state.abbreviation}`
        }
      />
      <meta
        property="og:image"
        content="https://rentail.space/images/og-image.png"
      />
      <meta
        property="og:url"
        content={`https://rentail.space/center/${center.id}`}
      />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Rentail.space" />
      <meta property="og:locale" content="en_US" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:title"
        content={`${center.name} - ${center.city}, ${center.state.abbreviation}`}
      />
      <meta
        name="twitter:description"
        content={
          center.summary
            ? `${center.summary} Located at ${center.address}, ${center.city}, ${center.state.abbreviation}.`
            : `Shopping center at ${center.address}, ${center.city}, ${center.state.abbreviation}`
        }
      />
      <meta
        name="twitter:image"
        content="https://rentail.space/images/og-image.png"
      />
      <link
        rel="canonical"
        href={`https://rentail.space/center/${center.id}`}
      />

      <CenterDetails center={center} />

      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Server-generated structured data
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaData(center)),
        }}
      />
    </main>
  );
}

function schemaData(
  center: PropertyGetPayload<{ include: { spaces: true; state: true } }>,
) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ShoppingCenter",
        name: center.name,
        address: {
          "@type": "PostalAddress",
          streetAddress: center.address,
          addressLocality: center.city,
          addressRegion: center.state.abbreviation,
          addressCountry: center.state.country || "US",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: center.latitude,
          longitude: center.longitude,
        },
        ...(center.phone && { telephone: center.phone }),
        ...(center.website && { url: externalLink(center.website) }),
        ...(center.imageURLs.length > 0 && { image: center.imageURLs }),
        ...(center.description && { description: center.description }),
        ...(center.openFrom === 0 && center.openUntil === 2400
          ? {
              openingHoursSpecification: {
                "@type": "OpeningHoursSpecification",
                opens: "00:00",
                closes: "24:00",
              },
            }
          : center.openFrom &&
            center.openUntil && {
              openingHoursSpecification: {
                "@type": "OpeningHoursSpecification",
                opens: `${Math.floor(center.openFrom / 100)}:${String(center.openFrom % 100).padStart(2, "0")}`,
                closes: `${Math.floor(center.openUntil / 100)}:${String(center.openUntil % 100).padStart(2, "0")}`,
              },
            }),
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
            name: center.state.abbreviation,
            item: `https://rentail.space/state/${center.state.abbreviation}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: center.name,
            item: `https://rentail.space/center/${center.id}`,
          },
        ],
      },
    ],
  };
}

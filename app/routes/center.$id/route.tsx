import type { PropertyGetPayload } from "prisma/generated/models";
import externalLink from "~/lib/externalLink";
import prisma from "~/lib/prisma";
import type { Route } from "./+types/route";
import CenterDetails from "./CenterDetails";

export async function loader({ params }: Route.LoaderArgs) {
  const center = await prisma.property.findUnique({
    include: { spaces: { where: { available: true } } },
    where: { id: params.id },
  });
  if (!center) throw new Response("Not Found", { status: 404 });
  return center;
}

export default function CenterPage({
  loaderData: center,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  return (
    <main className="container mx-auto my-10 space-y-8 p-5">
      <title>
        {`${center.name} - ${center.city}, ${center.state} | Rentail.space`}
      </title>
      <meta
        name="description"
        content={
          center.summary
            ? `${center.summary} Located at ${center.address}, ${center.city}, ${center.state}.`
            : `Shopping center at ${center.address}, ${center.city}, ${center.state}`
        }
      />
      <meta
        name="keywords"
        content={`${center.name}, ${center.city} ${center.state}, shopping center, specialty leasing, kiosk rental, pop-up shop, temporary retail, mall leasing`}
      />
      <meta name="author" content="rentail.space" />
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

function schemaData(center: PropertyGetPayload<{ include: { spaces: true } }>) {
  return {
    "@context": "https://schema.org",
    "@type": "ShoppingCenter",
    name: center.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: center.address,
      addressLocality: center.city,
      addressRegion: center.state,
      addressCountry: center.country || "US",
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
  };
}

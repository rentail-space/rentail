import { lazy, Suspense } from "react";
import prisma from "~/lib/prisma";
import { cleanParseProfile } from "~/lib/userProfile";
import { findUserAndChat } from "~/sessions.server";
import type { Route } from "./+types/route";
import PropertiesList from "./PropertiesList";

export async function loader({ request }: Route.LoaderArgs) {
  const found = await findUserAndChat(request.headers);
  const profile = found ? cleanParseProfile(found.user.workingMemory) : {};
  const properties = await prisma.property.findMany({
    include: { spaces: true },
  });
  return { properties, ...profile.location };
}

export default function PropertyPage({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  const PropertyMap = lazy(() => import("~/routes/properties/PropertiesMap"));

  return (
    <div>
      <Suspense
        fallback={<div className="h-96 animate-pulse rounded-lg bg-gray-200" />}
      >
        <PropertyMap
          properties={loaderData.properties}
          latitude={loaderData.latitude ?? 34.0522}
          longitude={loaderData.longitude ?? -118.2437}
        />
      </Suspense>

      <PropertiesList properties={loaderData.properties} />
    </div>
  );
}

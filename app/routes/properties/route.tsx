import env from "~/lib/env";
import prisma from "~/lib/prisma";
import { cleanParseProfile } from "~/lib/userProfile";
import { findUserAndChat } from "~/sessions.server";
import type { Route } from "./+types/route";
import PropertiesList from "./PropertiesList";
import PropertiesMap from "./PropertiesMap";

export async function loader({ request }: Route.LoaderArgs) {
  const found = await findUserAndChat(request.headers);
  const profile = found ? cleanParseProfile(found.user.workingMemory) : {};
  const mapboxToken = env.MAPBOX_TOKEN;
  const properties = await prisma.property.findMany({
    include: { spaces: true },
  });
  return { properties, ...profile.location, mapboxToken };
}

export default function PropertyPage({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  return (
    <div>
      <PropertiesMap
        mapboxToken={loaderData.mapboxToken}
        properties={loaderData.properties}
        latitude={loaderData.latitude ?? 34.0522}
        longitude={loaderData.longitude ?? -118.2437}
        width={800}
        height={384}
      />

      <PropertiesList properties={loaderData.properties} />
    </div>
  );
}

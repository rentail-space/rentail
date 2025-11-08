import env from "~/lib/env";
import prisma from "~/lib/prisma";
import { cleanParseProfile } from "~/lib/userProfile";
import { findUserAndChat } from "~/sessions.server";
import type { Route } from "./+types/route";
import CentersList from "./CentersList";
import CentersMap from "./CentersMap";

export async function loader({ request }: Route.LoaderArgs) {
  const found = await findUserAndChat(request.headers);
  const profile = found ? cleanParseProfile(found.user.workingMemory) : {};
  const mapboxToken = env.MAPBOX_TOKEN;
  const centers = await prisma.property.findMany({
    include: { spaces: true },
  });
  return { centers, ...profile.location, mapboxToken };
}

export default function CenterPage({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  return (
    <div>
      <CentersMap
        mapboxToken={loaderData.mapboxToken}
        centers={loaderData.centers}
        latitude={loaderData.latitude ?? 34.0522}
        longitude={loaderData.longitude ?? -118.2437}
      />

      <CentersList centers={loaderData.centers} />
    </div>
  );
}

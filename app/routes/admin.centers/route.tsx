import env from "~/lib/env";
import prisma from "~/lib/prisma";
import { cleanParseProfile } from "~/lib/userProfile";
import { findUserAndLastChat } from "~/sessions.server";
import CentersMap from "../../components/ui/CentersMap";
import type { Route } from "./+types/route";
import CentersList from "./CentersList";

export async function loader({ request }: Route.LoaderArgs) {
  const found = await findUserAndLastChat(request.headers);
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
        centers={loaderData.centers}
        latitude={loaderData.latitude ?? 34.0522}
        longitude={loaderData.longitude ?? -118.2437}
        zoom={9}
      />

      <CentersList centers={loaderData.centers} />
    </div>
  );
}

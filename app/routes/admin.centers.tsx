import { invariant } from "es-toolkit";
import type { PropertySpace } from "prisma/generated/client";
import type { PropertyGetPayload } from "prisma/generated/models";
import { Link } from "react-router";
import env from "~/lib/env";
import prisma from "~/lib/prisma";
import { cleanParseProfile } from "~/lib/userProfile";
import { findUserAndLastChat } from "~/sessions.server";
import CentersMap from "../components/ui/CentersMap";
import type { Route } from "./+types/admin.centers";

const mapboxToken = env.MAPBOX_TOKEN;

export async function loader({ request }: Route.LoaderArgs) {
  const found = await findUserAndLastChat(request.headers);
  invariant(found?.isAdmin, "User is not an admin");

  const { location } = cleanParseProfile(found.user.workingMemory);
  const centers = await prisma.property.findMany({
    include: { spaces: true },
  });
  return { centers, ...location, mapboxToken };
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

function CentersList({
  centers,
}: {
  centers: PropertyGetPayload<{ include: { spaces: true } }>[];
}) {
  return (
    <div className="prose prose-md mx-auto flex flex-col gap-4">
      {centers.map((center) => (
        <Center key={center.id} center={center} />
      ))}
    </div>
  );
}

function Center({
  center,
}: {
  center: PropertyGetPayload<{ include: { spaces: true } }>;
}) {
  const paragraphs = center.description.split("\n");

  return (
    <section key={center.id} className="flex flex-col gap-2">
      <h3>
        <Link
          className="text-blue-500 no-underline hover:text-blue-700 hover:underline"
          to={`/center/${center.id}`}
        >
          {center.name}
        </Link>
      </h3>

      <div>{paragraphs[0]}</div>
      <div>
        <Link
          className="text-blue-500 no-underline hover:text-blue-700 hover:underline"
          to={`https://maps.google.com/?q=${encodeURIComponent(`${center.address}, ${center.city}, ${center.state} ${center.country}`)}`}
          target="_blank"
        >
          {center.address}, {center.city}, {center.state}
        </Link>
      </div>

      <Spaces spaces={center.spaces} />
    </section>
  );
}

function Spaces({ spaces }: { spaces: PropertySpace[] }) {
  return spaces.length > 0 ? (
    <>
      <h4 className="text-center">Available Spaces</h4>

      <table className="table-zebra table">
        <thead>
          <tr>
            <th>Number</th>
            <th className="w-24 text-right">Size</th>
            <th className="w-20">Type</th>
            <th className="w-20">Floor</th>
          </tr>
        </thead>
        <tbody>
          {spaces
            .sort((a, b) =>
              a.type !== b.type
                ? a.type.localeCompare(b.type)
                : a.number.localeCompare(b.number),
            )
            .map((space) => (
              <tr key={space.id}>
                <td>{space.number}</td>
                <td className="text-right">
                  {space.size.toLocaleString()} sq ft
                </td>
                <td>{space.type}</td>
                <td>{space.floor}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </>
  ) : (
    <p className="text-center text-gray-400 text-lg">No spaces available</p>
  );
}

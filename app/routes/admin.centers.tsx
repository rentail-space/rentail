import { MapPinIcon } from "lucide-react";
import type { PropertySpace } from "prisma/generated/client";
import type { PropertyGetPayload } from "prisma/generated/models";
import { useRef } from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/Button";
import CentersMap, { type CenterMapFunction } from "~/components/ui/CentersMap";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "~/components/ui/Table";
import envVars from "~/lib/env";
import prisma from "~/lib/prisma";
import { verifyAdmin } from "~/lib/sessions.server";
import { cleanParseWorkingMemory } from "~/lib/workingMemory";
import type { Route } from "./+types/admin.centers";

const mapboxToken = envVars.MAPBOX_TOKEN;

export async function loader({ request }: Route.LoaderArgs) {
  const user = await verifyAdmin(request.headers);
  const { location } = cleanParseWorkingMemory(user.workingMemory);
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
  const centerRef = useRef<CenterMapFunction>(null);
  return (
    <div>
      <CentersMap
        centerRef={centerRef}
        centers={loaderData.centers}
        latitude={loaderData.latitude ?? 34.0522}
        longitude={loaderData.longitude ?? -118.2437}
      />

      <CentersList centerRef={centerRef} centers={loaderData.centers} />
    </div>
  );
}

function CentersList({
  centers,
  centerRef,
}: {
  centers: PropertyGetPayload<{ include: { spaces: true } }>[];
  centerRef: React.RefObject<
    ((center: { longitude: number; latitude: number }) => void) | null
  >;
}) {
  return (
    <div className="prose prose-md mx-auto flex flex-col gap-4">
      {centers.map((center) => (
        <Center key={center.id} center={center} centerRef={centerRef} />
      ))}
    </div>
  );
}

function Center({
  center,
  centerRef,
}: {
  center: PropertyGetPayload<{ include: { spaces: true } }>;
  centerRef: React.RefObject<
    ((center: { longitude: number; latitude: number }) => void) | null
  >;
}) {
  const paragraphs = center.description.split("\n");

  return (
    <section key={center.id} className="flex flex-col gap-2">
      <h3 className="flex flex-row items-center justify-between gap-2">
        <Link
          className="text-blue-500 no-underline hover:text-blue-700 hover:underline"
          title="View center"
          to={`/center/${center.id}`}
        >
          {center.name}
        </Link>

        <Button
          onClick={(event) => {
            event.preventDefault();
            centerRef.current?.({
              longitude: center.longitude ?? 0,
              latitude: center.latitude ?? 0,
            });
          }}
          title="Center on map"
          variant="link"
          className="cursor-pointer"
        >
          <MapPinIcon className="h-10 w-10 text-blue-500" />
        </Button>
      </h3>

      <p>{paragraphs[0]}</p>
      <div>
        <Link
          className="text-blue-500 no-underline hover:text-blue-700 hover:underline"
          to={`https://maps.google.com/?q=${encodeURIComponent(`${center.address}, ${center.city}, ${center.state} ${center.country}`)}`}
          target="_blank"
          title="Open in Google Maps"
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

      <Table>
        <TableHeader>
          <TableRow>
            <th>Number</th>
            <th className="w-24 text-right">Size</th>
            <th className="w-20">Type</th>
            <th className="w-20">Floor</th>
          </TableRow>
        </TableHeader>
        <TableBody>
          {spaces
            .sort((a, b) =>
              a.type !== b.type
                ? a.type.localeCompare(b.type)
                : a.number.localeCompare(b.number),
            )
            .map((space) => (
              <TableRow key={space.id}>
                <TableCell>{space.number}</TableCell>
                <TableCell className="text-right">
                  {space.size.toLocaleString()} sq ft
                </TableCell>
                <TableCell>{space.type}</TableCell>
                <TableCell>{space.floor}</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </>
  ) : (
    <p className="text-center text-gray-400 text-lg">No spaces available</p>
  );
}

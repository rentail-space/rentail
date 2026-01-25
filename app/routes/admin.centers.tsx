import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown, ArrowUp, MapPinIcon } from "lucide-react";
import type { PropertyGetPayload } from "prisma/generated/models";
import { useRef } from "react";
import { ActiveLink } from "~/components/ui/ActiveLink";
import CentersMap, { type CenterMapFunction } from "~/components/ui/CentersMap";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
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
    include: { spaces: true, state: true },
  });
  return { centers, ...location, mapboxToken };
}

export default function CenterPage({ loaderData }: Route.ComponentProps) {
  const centerRef = useRef<CenterMapFunction>(null);
  return (
    <div className="flex flex-col gap-8">
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
  centers: PropertyGetPayload<{ include: { spaces: true; state: true } }>[];
  centerRef: React.RefObject<
    ((center: { longitude: number; latitude: number }) => void) | null
  >;
}) {
  const virtualizer = useVirtualizer({
    count: centers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 20,
  });
  const table = useReactTable({
    columns: [
      { enableSorting: false, id: " ", size: 40 },
      { accessorKey: "name", size: 600, header: "Shopping Center" },
      { accessorKey: "city", size: 140, header: "City" },
      { accessorKey: "state", header: "State", size: 100 },
      { accessorKey: "spaces", size: 120, header: "Spaces" },
    ],
    data: centers,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { sorting: [{ id: "name", desc: false }] },
  });
  const parentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="container" ref={parentRef}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.column.getSize() }}
                  >
                    {header.getContext().column.getCanSort() ? (
                      <button
                        className="flex w-full justify-between p-2 font-bold"
                        onClick={header.column.getToggleSortingHandler()}
                        type="button"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getIsSorted() === "desc" ? (
                          <ArrowUp />
                        ) : header.column.getIsSorted() === "asc" ? (
                          <ArrowDown />
                        ) : (
                          <span />
                        )}
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-gray-100">
                <TableCell>
                  <MapPinIcon
                    className="h-6 w-6"
                    onClick={() => {
                      centerRef.current?.({
                        longitude: row.original.longitude ?? 0,
                        latitude: row.original.latitude ?? 0,
                      });
                    }}
                  />
                </TableCell>
                <TableCell>
                  <ActiveLink to={`/center/${row.original.id}`}>
                    {row.original.name}
                  </ActiveLink>
                </TableCell>
                <TableCell>{row.original.city}</TableCell>
                <TableCell>
                  <ActiveLink to={`/state/${row.original.state.abbreviation}`}>
                    {row.original.state.abbreviation}
                  </ActiveLink>
                </TableCell>
                <TableCell className="text-right">
                  {row.original.spaces.length}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

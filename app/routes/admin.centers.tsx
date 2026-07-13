import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, MapPinIcon } from "lucide-react";
import type { PropertyGetPayload } from "prisma/generated/models";
import { Suspense, useRef } from "react";
import { Await, href } from "react-router";
import { ActiveLink } from "~/components/ui/ActiveLink";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader } from "~/components/ui/Card";
import CentersMap, { type CenterMapFunction } from "~/components/ui/CentersMap";
import LoadingProgress from "~/components/ui/LoadingProgress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/Table";
import envVars from "~/lib/env";
import prisma from "~/lib/prisma.server";
import { verifyAdmin } from "~/lib/sessions.server";
import { cleanParseWorkingMemory } from "~/lib/workingMemory";
import type { Route } from "./+types/admin.centers";

const mapboxToken = envVars.MAPBOX_TOKEN;

export async function loader({ request }: Route.LoaderArgs) {
  const user = await verifyAdmin(request.headers);
  const { location } = cleanParseWorkingMemory(user.workingMemory);
  const centers = prisma.property.findMany({
    include: { spaces: true, state: true },
  });
  return { centers: Promise.resolve(centers), location, mapboxToken };
}

export default function CenterPage({ loaderData }: Route.ComponentProps) {
  const centerRef = useRef<CenterMapFunction>(null);
  return (
    <Suspense fallback={<LoadingProgress />}>
      <Await resolve={loaderData.centers}>
        {(centers) => (
          <section className="flex flex-col gap-8">
            <CentersMap
              accessToken={loaderData.mapboxToken}
              centerRef={centerRef}
              centers={centers}
              latitude={loaderData.location?.latitude ?? 34.0522}
              longitude={loaderData.location?.longitude ?? -118.2437}
            />
            <CentersList centerRef={centerRef} centers={centers} />
          </section>
        )}
      </Await>
    </Suspense>
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
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      sorting: [{ id: "name", desc: false }],
      pagination: { pageSize: 100 },
    },
  });

  return (
    <Card className="bg-secondary-background text-foreground">
      <CardHeader className="flex flex-row items-center justify-center gap-2">
        <Button
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
          variant="secondary"
        >
          {"<"}
        </Button>
        {table.getPageOptions().map((page) => (
          <Button
            className="px-4"
            disabled={table.getState().pagination.pageIndex === page}
            key={page}
            onClick={() => table.setPageIndex(page)}
            variant="secondary"
          >
            {page + 1}
          </Button>
        ))}
        <Button
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
          variant="secondary"
        >
          {">"}
        </Button>
      </CardHeader>

      <CardContent>
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
            {table.getPaginationRowModel().rows.map((row) => (
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
                  <ActiveLink to={href("/center/:id", { id: row.original.id })}>
                    {row.original.name}
                  </ActiveLink>
                </TableCell>
                <TableCell>{row.original.city}</TableCell>
                <TableCell>
                  <ActiveLink
                    to={href("/state/:state", {
                      state: row.original.state.abbreviation,
                    })}
                  >
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
      </CardContent>
    </Card>
  );
}

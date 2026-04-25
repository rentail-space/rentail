import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, EqualIcon } from "lucide-react";
import type { PropertyGetPayload } from "prisma/generated/models";
import { Suspense } from "react";
import { Await, useFetcher, useSearchParams } from "react-router";
import { ActiveLink } from "~/components/ui/ActiveLink";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
import LoadingProgress from "~/components/ui/LoadingProgress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/Table";
import findNearbyCenters from "~/lib/findNearbyCenters.server";
import calculateRanking from "~/lib/scrape/ranking";
import type { Route } from "./+types/admin.ranked-centers";

export async function loader({ request }: Route.LoaderArgs) {
  const found = findNearbyCenters({
    headers: new Headers(),
    limit: 10,
    location: new URL(request.url).searchParams.get("location") ?? "",
  });
  return Promise.resolve(found);
}

export default function RankingPage({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <section className="space-y-4">
      <h1 className="text-center font-bold text-2xl">
        Shopping Center Ranking
      </h1>

      <fetcher.Form
        className="flex items-center gap-2"
        method="get"
        onSubmit={(event) => {
          event.preventDefault();
          setSearchParams(
            (params) => {
              params.set("location", event.currentTarget.location.value);
              return params;
            },
            { replace: true },
          );
          void fetcher.submit(event.currentTarget);
        }}
      >
        <Input
          defaultValue={searchParams.get("location") ?? ""}
          name="location"
          type="search"
        />
        <Button disabled={fetcher.state !== "idle"} type="submit">
          {fetcher.state !== "idle" ? "Searching..." : "Search"}
        </Button>
      </fetcher.Form>

      <Suspense fallback={<LoadingProgress />}>
        <Await resolve={loaderData}>
          {({ centers, displayName }) => (
            <VisibleResults centers={centers} displayName={displayName} />
          )}
        </Await>
      </Suspense>
    </section>
  );
}

function VisibleResults({
  displayName,
  centers,
}: {
  displayName: string;
  centers: PropertyGetPayload<{ include: { spaces: true; state: true } }>[];
}) {
  const table = useReactTable({
    columns: [
      {
        accessorKey: "name",
        cell: ({ row }) => (
          <ActiveLink to={`/center/${row.original.id}`}>
            {row.original.name}
          </ActiveLink>
        ),
        header: "Shopping Center",
        size: 600,
      },
      { accessorKey: "city", size: 140, header: "City" },
      {
        accessorFn: (row) => row.state.abbreviation,
        header: "State",
        size: 80,
      },
      {
        accessorFn: (row) => row.spaces.length,
        accessorKey: "spaces",
        header: "Spaces",
        size: 80,
      },
      {
        accessorKey: "ranking",
        cell: ({ row }) => (
          <span className="flex flex-row justify-between gap-2">
            <span>
              {row.original.rating} * log(
              {row.original.reviewCount?.toLocaleString()}) *{" "}
              {row.original.tier}
            </span>
            <EqualIcon className="h-4 w-4" />
            <span>{calculateRanking(row.original).toFixed(2)}</span>
          </span>
        ),
        header: "Ranking",
        size: 220,
      },
    ],
    data: centers,
    enableSortingRemoval: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { sorting: [] },
  });

  return (
    <Card className="bg-secondary-background text-foreground">
      <CardHeader>
        <CardTitle>{displayName || "no location"}</CardTitle>
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
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-gray-100">
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    className="truncate"
                    key={cell.id}
                    style={{ maxWidth: cell.column.getSize() }}
                    title={cell.getValue() as string}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

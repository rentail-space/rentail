import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Suspense } from "react";
import { Await, useSearchParams } from "react-router";
import { twMerge } from "tailwind-merge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import LoadingProgress from "~/components/ui/LoadingProgress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/Table";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/Tabs";
import checkRankings from "~/lib/seo-rank/checkRanking.server";
import type { Route } from "./+types/admin.seo-rank";

export async function loader({ request }: Route.LoaderArgs) {
  const engine = getSearchEngine(
    new URL(request.url).searchParams.get("engine"),
  );
  const data = checkRankings({ engine, everyDays: 10, limit: 20 });
  return { data };
}

const searchEngines = [
  {
    label: "Google",
    id: "google",
  },
  {
    label: "Google AI Mode",
    id: "google_ai_mode",
  },
  {
    label: "Bing",
    id: "bing",
  },
  {
    label: "DuckDuckGo",
    id: "duckduckgo",
  },
];

function getSearchEngine(param: string | null): string {
  for (const engine of searchEngines) if (engine.id === param) return engine.id;
  return searchEngines[0].id;
}

export default function RankingPage({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const engine = getSearchEngine(searchParams.get("engine"));

  function setEngine(engine: string) {
    setSearchParams(
      (params) => {
        params.set("engine", engine);
        return params;
      },
      { replace: true },
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-center font-bold text-2xl">SEO Ranking</h1>

      <Tabs value={engine}>
        <TabsList>
          {searchEngines.map((engine) => (
            <TabsTrigger
              key={engine.id}
              value={engine.id}
              onClick={() => setEngine(engine.id)}
            >
              {engine.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Suspense fallback={<LoadingProgress />}>
        <Await resolve={loaderData.data}>
          {(data) => <VisibleResults data={data} />}
        </Await>
      </Suspense>
    </section>
  );
}

function VisibleResults({
  data,
}: {
  data: { hostname: string; count: number }[];
}) {
  const table = useReactTable({
    columns: [
      {
        accessorKey: "hostname",
        header: "Hostname",
        size: 600,
      },
      { accessorKey: "count", size: 140, header: "Count" },
    ],
    data,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card className="bg-secondary-background text-foreground">
      <CardHeader>
        <CardTitle>SEO Ranking</CardTitle>
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
              <TableRow
                className={twMerge(
                  "hover:bg-gray-100",
                  row.original.hostname === "rentail.space" && "bg-green-200",
                )}
                key={row.id}
              >
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

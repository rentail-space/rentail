import { groupBy, mean, orderBy, sortBy } from "es-toolkit";
import { DateTime } from "luxon";
import { twMerge } from "tailwind-merge";
import { Card, CardContent } from "~/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/Table";

export default function RecentVisibility({
  visibility,
}: {
  visibility: {
    category: string;
    citations: string[];
    query: string;
    createdAt: Date;
  }[];
}) {
  const groupedByDate = Object.entries(
    groupBy(visibility, ({ createdAt }) => createdAt.toISOString()),
  ).map(([date, queries]) => ({
    date,
    queries: queries.map((query) => ({
      category: query.category,
      citations: query.citations,
      query: query.query,
      ratio: citationRatio(query.citations),
      rentail: query.citations.filter(isRentail).length,
      score: scoreCitations(query.citations),
    })),
  }));
  const mostRecentQueries = orderBy(
    Object.entries(groupedByDate),
    [([date]) => date],
    ["asc"],
  )[0][1];
  const rows = sortBy(mostRecentQueries.queries, ["category", "query"]);

  return (
    <Card className="bg-secondary-background text-foreground">
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="font-bold">Query ID</TableHead>
              <TableHead className="font-bold">Query</TableHead>
              <TableHead className="font-bold">Citations</TableHead>
              <TableHead className="font-bold">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={index.toString()}
                className={twMerge(
                  row.rentail > 0 ? "bg-green-100" : "",
                  "hover:bg-gray-100",
                )}
              >
                <TableHead className="font-bold">{row.category}</TableHead>
                <TableCell>{row.query}</TableCell>
                <TableCell className={row.rentail > 0 ? "font-bold" : ""}>
                  {row.rentail} / {row.citations.length}
                </TableCell>
                <TableCell>{row.score}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableHead colSpan={2}>
                {DateTime.fromISO(mostRecentQueries.date).toFormat(
                  "yyyy-MM-dd",
                )}
              </TableHead>
              <TableHead>
                {mean(rows.map((row) => row.rentail)).toLocaleString()} /{" "}
                {rows.length}
              </TableHead>
              <TableHead>
                {mean(rows.map((row) => row.score)).toLocaleString()}
              </TableHead>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}

function citationRatio(citations: string[]): number {
  return citations.length > 0
    ? citations.filter(isRentail).length / citations.length
    : 0;
}

function scoreCitations(citations: string[]): number {
  const isFirstPlace = citations.length > 0 && isRentail(citations[0]);
  return (isFirstPlace ? 50 : 0) + citations.filter(isRentail).length * 10;
}

function isRentail(citation: string): boolean {
  return new URL(citation).hostname === "rentail.space";
}

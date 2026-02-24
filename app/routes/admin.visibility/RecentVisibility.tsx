import { groupBy, mean, orderBy, sortBy } from "es-toolkit";
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

type Check = {
  category: string;
  citations: string[];
  mentioned: boolean;
  position: number | null;
  query: string;
  repetition: number;
};

type Run = {
  checks: Check[];
  createdAt: Date;
  id: string;
  model: string;
  platform: string;
};

type QueryAggregate = {
  category: string;
  query: string;
  visibilityPct: number;
  avgCitations: number;
  score: number;
};

export default function RecentVisibility({ runs }: { runs: Run[] }) {
  if (runs.length === 0) return <p>No runs yet.</p>;

  const mostRecent = orderBy(runs, [(r) => r.createdAt], ["desc"])[0];
  const byQuery = Object.entries(
    groupBy(mostRecent.checks, (c) => c.query),
  ).map(([query, checks]): QueryAggregate => {
    const category = checks[0].category;
    const visibilityPct = mean(checks.map((c) => (c.mentioned ? 1 : 0))) * 100;
    const avgCitations = mean(checks.map((c) => c.citations.length));
    const isFirstPlaceRatio = mean(
      checks.map((c) =>
        c.citations.length > 0 && isRentail(c.citations[0]) ? 1 : 0,
      ),
    );
    const rentailAvg = mean(
      checks.map((c) => c.citations.filter(isRentail).length),
    );
    const score = isFirstPlaceRatio * 50 + rentailAvg * 10;
    return { category, query, visibilityPct, avgCitations, score };
  });
  const rows = sortBy(byQuery, ["category", "query"]);

  return (
    <Card className="bg-secondary-background text-foreground">
      <CardContent>
        <p className="mb-2 text-muted-foreground text-sm">
          Run: {mostRecent.createdAt.toISOString().slice(0, 10)} ·{" "}
          {mostRecent.checks.length} checks · {mostRecent.platform} /{" "}
          {mostRecent.model}
        </p>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="font-bold">Category</TableHead>
              <TableHead className="font-bold">Query</TableHead>
              <TableHead className="font-bold">Visibility %</TableHead>
              <TableHead className="font-bold">Avg Citations</TableHead>
              <TableHead className="font-bold">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={index.toString()}
                className={twMerge(
                  row.visibilityPct > 0 ? "bg-green-100" : "",
                  "hover:bg-gray-100",
                )}
              >
                <TableHead className="font-bold">{row.category}</TableHead>
                <TableCell>{row.query}</TableCell>
                <TableCell className={row.visibilityPct > 0 ? "font-bold" : ""}>
                  {row.visibilityPct.toFixed(0)}%
                </TableCell>
                <TableCell>{row.avgCitations.toFixed(1)}</TableCell>
                <TableCell>{row.score.toFixed(0)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableHead colSpan={2}>Totals</TableHead>
              <TableHead>
                {mean(rows.map((r) => r.visibilityPct)).toFixed(0)}%
              </TableHead>
              <TableHead>
                {mean(rows.map((r) => r.avgCitations)).toFixed(1)}
              </TableHead>
              <TableHead>{mean(rows.map((r) => r.score)).toFixed(0)}</TableHead>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}

function isRentail(url: string): boolean {
  try {
    return new URL(url).hostname === "rentail.space";
  } catch {
    return false;
  }
}

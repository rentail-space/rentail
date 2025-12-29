import { groupBy } from "node_modules/es-toolkit/dist/array/groupBy.mjs";
import { sumBy } from "node_modules/es-toolkit/dist/math/sumBy.mjs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "~/components/ui/Table";
import type { loader } from "./route";

export default function Sources({
  analytics,
}: {
  analytics: Awaited<ReturnType<typeof loader>>["analytics"];
}) {
  const grouped = groupBy(
    analytics,
    (entry: { sessionSource: string }) => entry.sessionSource,
  );

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-bold text-2xl">
        Sources{" "}
        <span className="text-gray-500">
          ({sumBy(Object.values(analytics), (entry) => entry.visitors)} visitors
          / {Object.keys(grouped).length} sources)
        </span>
      </h2>
      <Table>
        <TableBody>
          {Object.entries(grouped).map(([sessionSource, entries], index) => (
            <TableRow key={sessionSource} className="hover:bg-gray-100">
              <TableHead className="w-10">{index + 1}</TableHead>
              <TableCell>{sessionSource}</TableCell>
              <TableCell className="text-right">
                {sumBy(entries, (entry) => entry.visitors).toLocaleString()}{" "}
                users
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

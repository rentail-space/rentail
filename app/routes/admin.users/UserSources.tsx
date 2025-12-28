import { groupBy } from "node_modules/es-toolkit/dist/array/groupBy.mjs";
import { sumBy } from "node_modules/es-toolkit/dist/math/sumBy.mjs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "~/components/ui/Table";

export default function Sources({
  analytics,
}: {
  analytics: Array<{
    sessionSource: string;
    activeUsers: number;
  }>;
}) {
  const grouped = groupBy(
    analytics,
    (entry: { sessionSource: string; activeUsers: number }) =>
      entry.sessionSource,
  );

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-bold text-2xl">
        Sources{" "}
        <span className="text-gray-500">
          ({sumBy(Object.values(analytics), (entry) => entry.activeUsers)} users
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
                {sumBy(entries, (entry) => entry.activeUsers).toLocaleString()}{" "}
                users
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

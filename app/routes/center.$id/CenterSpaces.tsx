import type { PropertySpace } from "prisma/generated";
import { Card, CardContent } from "~/components/ui/Card";

export function CenterSpaces({ spaces }: { spaces: PropertySpace[] }) {
  return (
    <Card className="bg-white">
      <CardContent>
        <h2 className="text-center font-bold text-2xl">
          {spaces.length === 0 ? "No available spaces" : "Available Spaces"}
        </h2>
        {spaces
          .sort((a, b) =>
            a.type !== b.type
              ? a.type.localeCompare(b.type)
              : a.number.localeCompare(b.number),
          )
          .map((space) => (
            <Space key={space.number} space={space} />
          ))}
      </CardContent>
    </Card>
  );
}

function Space({ space }: { space: PropertySpace }) {
  return (
    <div className="grid grid-cols-2 gap-4 py-4 lg:grid-cols-4">
      <Metric title="number" value={space.number} />
      <Metric
        title="size (sqft)"
        value={
          space.size?.toLocaleString(undefined, { style: "decimal" }) ?? "N/A"
        }
      />
      <Metric
        title="floor"
        value={
          space.floor?.toLocaleString(undefined, { style: "decimal" }) ?? "N/A"
        }
      />
      <Metric title="type" value={space.type} />
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="font-bold text-gray-500 text-xs uppercase tracking-wide">
        {title}
      </span>
      <span className="font-bold text-2xl text-black">{value}</span>
    </div>
  );
}

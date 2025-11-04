import type { PropertySpace } from "prisma/generated/client";

export function Spaces({ spaces }: { spaces: PropertySpace[] }) {
  return spaces.length ? (
    spaces
      .sort((a, b) =>
        a.type !== b.type
          ? a.type.localeCompare(b.type)
          : a.number.localeCompare(b.number),
      )
      .map((space) => <Space key={space.id} space={space} />)
  ) : (
    <NoAvailableSpaces />
  );
}

function NoAvailableSpaces() {
  return (
    <p className="my-4 text-gray-500 text-lg">
      Sorry, all spaces are currently leased. Please check back later.
    </p>
  );
}

function Space({ space }: { space: PropertySpace }) {
  return (
    <div className="grid grid-cols-4 gap-4 rounded-lg border border-gray-300 p-4">
      <Metric label="number" value={space.number} />
      <Metric
        label="size"
        value={space.size.toLocaleString(undefined, { style: "decimal" })}
        unit="sqft"
      />
      <Metric label="type" value={space.type} />
      <Metric
        label="floor"
        value={space.floor.toLocaleString(undefined, { style: "decimal" })}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <p className="flex flex-col items-center justify-center gap-2">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="font-bold text-2xl">{value}</span>
      <span className="text-gray-500 text-sm">{unit || " . "}</span>
    </p>
  );
}

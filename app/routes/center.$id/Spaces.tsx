import type { PropertySpace } from "prisma/generated/client";

export function Spaces({ spaces }: { spaces: PropertySpace[] }) {
  return (
    <div className="space-y-4">
      {spaces.length ? (
        spaces
          .sort((a, b) =>
            a.type !== b.type
              ? a.type.localeCompare(b.type)
              : a.number.localeCompare(b.number),
          )
          .map((space) => <Space key={space.id} space={space} />)
      ) : (
        <NoAvailableSpaces />
      )}
    </div>
  );
}

function NoAvailableSpaces() {
  return (
    <p className="font-bold text-black text-lg">
      Sorry, all spaces are currently leased. Please check back later.
    </p>
  );
}

function Space({ space }: { space: PropertySpace }) {
  return (
    <div className="grid grid-cols-2 gap-4 rounded-md border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_black] lg:grid-cols-4">
      <Metric title="number" value={space.number} />
      <Metric
        title="size (sqft)"
        value={space.size.toLocaleString(undefined, { style: "decimal" })}
      />
      <Metric title="type" value={space.type} />
      <Metric
        title="floor"
        value={space.floor.toLocaleString(undefined, { style: "decimal" })}
      />
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-sm border-2 border-black bg-[hsl(60,100%,99%)] p-4 shadow-[2px_2px_0px_0px_black]">
      <span className="font-bold text-black text-xs uppercase tracking-wide">
        {title}
      </span>
      <span className="font-bold text-2xl text-black">{value}</span>
    </div>
  );
}

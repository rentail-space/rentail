import type { PropertySpace } from "prisma/generated/client";

export function Spaces({ spaces }: { spaces: PropertySpace[] }) {
  return (
    <div className="mb-10 flex flex-col gap-4">
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
    <p className="my-4 text-center text-gray-400 text-lg">
      Sorry, all spaces are currently leased. Please check back later.
    </p>
  );
}

function Space({ space }: { space: PropertySpace }) {
  return (
    <div className="stats stats-vertical lg:stats-horizontal shadow">
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
    <div className="stat place-items-center">
      <span className="stat-title">{title}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

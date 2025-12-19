import { ArrowRightIcon } from "lucide-react";
import { Link } from "react-router";
import { Streamdown } from "streamdown";
import { Button } from "~/components/ui/Button";
import prisma from "~/lib/prisma";

export async function loader() {
  const states = await prisma.state.findMany({
    orderBy: { name: "asc" },
  });

  const centers = await prisma.property.groupBy({
    by: ["state"],
    orderBy: { state: "asc" },
    _count: { _all: true },
  });

  return { states, centers };
}

export default function StatePage({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  return (
    <main
      className="container mx-auto my-10 max-w-3xl space-y-8 p-5"
      aria-label="US states listing"
    >
      <title>
        Shopping Centers by State - Specialty Leasing & Retail Spaces |
        Rentail.space
      </title>
      <meta
        name="description"
        content="Browse specialty leasing and short-term retail opportunities by state. Find kiosks, pop-up shops, carts, and temporary retail spaces in shopping centers across all 50 US states. Real-time availability for seasonal and temporary retail locations."
      />
      <meta
        name="keywords"
        content="specialty leasing by state, kiosk rental locations, pop-up shop states, mall cart by state, temporary retail locations, shopping centers by state"
      />

      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: exception
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaData(loaderData)),
        }}
      />

      <h1 className="text-center font-bold text-2xl">US States</h1>

      <ul
        className="space-y-4 divide-y divide-gray-400"
        itemScope
        itemType="https://schema.org/ItemList"
      >
        {loaderData.states
          .filter(
            ({ abbreviation }) =>
              countCenters(loaderData.centers, abbreviation) > 0,
          )

          .map(({ abbreviation, name, lede }, index) => (
            <li
              key={abbreviation}
              className="pb-4"
              itemScope
              itemType="https://schema.org/ListItem"
              itemProp="itemListElement"
            >
              <meta itemProp="position" content={String(index + 1)} />
              <LinkToState
                abbreviation={abbreviation}
                name={name}
                lede={lede}
              />
            </li>
          ))}
      </ul>
    </main>
  );
}

function countCenters(
  centers: { state: string; _count: { _all: number } }[],
  abbreviation: string,
): number {
  return (
    centers.find(
      (center) => center.state.toLowerCase() === abbreviation.toLowerCase(),
    )?._count._all ?? 0
  );
}

function LinkToState({
  abbreviation,
  name,
  lede,
}: {
  abbreviation: string;
  name: string;
  lede: string;
}) {
  const url = `/state/${abbreviation.toLowerCase()}`;
  return (
    <div>
      <Link to={url} className="space-y-2" itemProp="url">
        <div className="flex flex-row items-center justify-between">
          <h2 className="font-bold text-xl" itemProp="name">
            {name}
          </h2>
        </div>
        <Streamdown className="text-gray-500" mode="static">
          {lede}
        </Streamdown>
      </Link>

      <div className="flex w-full flex-row justify-end">
        <Button variant="secondary" asChild>
          <Link to={`/state/${abbreviation.toLowerCase()}`}>
            See all centers
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function schemaData({
  states,
  centers,
}: {
  states: { abbreviation: string; name: string }[];
  centers: { state: string; _count: { _all: number } }[];
}) {
  // Build JSON-LD structured data for search engines
  const itemListElements = states
    .filter(({ abbreviation }) => countCenters(centers, abbreviation) > 0)
    .map(({ abbreviation, name }, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: name,
      url: `https://rentail.space/state/${abbreviation.toLowerCase()}`,
      description: `${countCenters(centers, abbreviation)} shopping centers in ${name}`,
    }));

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "US States with Shopping Centers",
    description: "Complete list of US states with available retail spaces",
    numberOfItems: itemListElements.length,
    itemListElement: itemListElements,
  };
}

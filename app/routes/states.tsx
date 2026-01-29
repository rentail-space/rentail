import { ArrowRightIcon } from "lucide-react";
import { Link } from "react-router";
import { Streamdown } from "streamdown";
import PageMeta from "~/components/seo/PageMeta";
import { ActiveLink } from "~/components/ui/ActiveLink";
import prisma from "~/lib/prisma.server";
import type { Route } from "./+types/states";

export async function loader() {
  const states = await prisma.state.findMany({
    orderBy: { name: "asc" },
  });

  const centers = await prisma.property.groupBy({
    by: ["stateAbbreviation"],
    orderBy: { stateAbbreviation: "asc" },
    _count: { _all: true },
  });

  return { states, centers };
}

export default function StatePage({ loaderData }: Route.ComponentProps) {
  return (
    <main
      className="container mx-auto my-10 max-w-3xl space-y-8 p-5"
      aria-label="US states listing"
    >
      <PageMeta
        title="Shopping Centers by State | Rentail.space"
        description="Browse specialty leasing and short-term retail opportunities by state. Find kiosks, pop-up shops, carts, and temporary retail spaces in shopping centers across all 50 US states. Real-time availability for seasonal and temporary retail locations."
        url="/states"
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

      <h1 className="whitespace-nowrap text-center font-bold text-2xl">
        US States
      </h1>

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
  centers: { stateAbbreviation: string; _count: { _all: number } }[],
  abbreviation: string,
): number {
  return (
    centers.find(
      (center) =>
        center.stateAbbreviation.toLowerCase() === abbreviation.toLowerCase(),
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
    <div className="flex flex-col gap-4">
      <Link to={url} className="space-y-4" itemProp="url">
        <h2 className="font-bold text-xl" itemProp="name">
          {name}
        </h2>
        <Streamdown className="text-gray-500" mode="static">
          {lede}
        </Streamdown>
      </Link>

      <div className="flex w-full flex-row justify-end">
        <ActiveLink
          variant="button"
          to={`/state/${abbreviation.toLowerCase()}`}
        >
          Visit {name} centers
          <ArrowRightIcon className="h-4 w-4" />
        </ActiveLink>
      </div>
    </div>
  );
}

function schemaData({
  states,
  centers,
}: {
  states: { abbreviation: string; name: string }[];
  centers: { stateAbbreviation: string; _count: { _all: number } }[];
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

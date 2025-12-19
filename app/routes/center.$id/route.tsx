import prisma from "~/lib/prisma";
import type { Route } from "./+types/route";
import Center from "./Center";

export async function loader({ params }: Route.LoaderArgs) {
  const center = await prisma.property.findUnique({
    include: { spaces: { where: { available: true } } },
    where: { id: params.id },
  });
  if (!center) throw new Response("Not Found", { status: 404 });
  return center;
}

export default function CenterPage({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  return (
    <main className="container mx-auto my-10 space-y-8 p-5">
      <title>
        {loaderData.name} - {loaderData.city}, {loaderData.state} |
        Rentail.space
      </title>
      <meta
        name="description"
        content={
          loaderData.summary
            ? `${loaderData.summary} Located at ${loaderData.address}, ${loaderData.city}, ${loaderData.state}.`
            : `Shopping center at ${loaderData.address}, ${loaderData.city}, ${loaderData.state} with ${loaderData.numberOfStores} stores and ${loaderData.squareFootage.toLocaleString()} square feet.`
        }
      />
      <meta
        name="keywords"
        content={`${loaderData.name}, ${loaderData.city} ${loaderData.state}, shopping center, specialty leasing, kiosk rental, pop-up shop, temporary retail, mall leasing`}
      />
      <meta name="author" content="rentail.space" />

      <Center center={loaderData} />
    </main>
  );
}

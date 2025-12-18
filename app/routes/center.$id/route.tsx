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

export function meta({ data: loaderData }: Route.MetaArgs) {
  if (!loaderData) return [];

  const center = loaderData;
  const description = center.summary
    ? `${center.summary} Located at ${center.address}, ${center.city}, ${center.state}.`
    : `Shopping center at ${center.address}, ${center.city}, ${center.state} with ${center.numberOfStores} stores and ${center.squareFootage.toLocaleString()} square feet.`;

  return [
    {
      title: `${center.name} - ${center.city}, ${center.state} | Rentail.space`,
    },
    {
      name: "description",
      content: description,
    },
    {
      name: "keywords",
      content: `${center.name}, ${center.city} ${center.state}, shopping center, specialty leasing, kiosk rental, pop-up shop, temporary retail, mall leasing`,
    },
  ];
}

export const handle = { headerLinks: [] };

export default function CenterPage({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  return (
    <main className="container mx-auto my-10 space-y-8 p-5">
      <Center center={loaderData} />
    </main>
  );
}

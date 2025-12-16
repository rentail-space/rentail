import prisma from "~/lib/prisma";
import type { Route } from "./+types/route";
import Center from "./Center";

export async function loader({ params }: Route.LoaderArgs) {
  const center = await prisma.property.findUnique({
    include: { spaces: true },
    where: { id: params.id },
  });
  if (!center) throw new Response("Not Found", { status: 404 });
  return center;
}

export const handle = { headerLinks: [] };

export default function CenterPage({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  return <Center center={loaderData} />;
}

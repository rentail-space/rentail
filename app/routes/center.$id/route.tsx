import type { PropertyGetPayload } from "prisma/generated/models";
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
  loaderData: PropertyGetPayload<{ include: { spaces: true } }>;
}) {
  return <Center center={loaderData} />;
}

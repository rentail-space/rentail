import type { PropertyGetPayload } from "prisma/generated/models";
import prisma from "~/lib/prisma";
import type { Route } from "./+types/route";
import Property from "./Property";

export async function loader({ params }: Route.LoaderArgs) {
  const property = await prisma.property.findUnique({
    include: { spaces: true },
    where: { id: params.id },
  });
  if (!property) throw new Response("Not Found", { status: 404 });
  return property;
}

export default function PropertyPage({
  loaderData,
}: {
  loaderData: PropertyGetPayload<{ include: { spaces: true } }>;
}) {
  return <Property property={loaderData} />;
}

import prisma from "~/lib/prisma";
import { verifyAdmin } from "~/sessions.server";
import type { Route } from "./+types/api.admin.$userId.note";

export async function action({ params, request }: Route.ActionArgs) {
  await verifyAdmin(request.headers);

  const formData = await request.formData();
  const note = formData.get("note") as string;
  console.log(note);
  console.log(params.userId);
  const user = await prisma.user.update({
    data: { note },
    where: { id: params.userId },
  });
  return user;
}

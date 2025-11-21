import { redirect } from "react-router";
import prisma from "~/lib/prisma";
import type { Route } from "./+types/email.verify.$verificationId";

export async function loader({ params }: Route.ActionArgs) {
  const { verificationId } = params;
  const verification = await prisma.verification.findFirst({
    where: { id: verificationId },
  });
  if (!verification)
    return new Response("Verification not found", { status: 404 });
  if (verification.expiresAt < new Date())
    return new Response("Verification expired, please request a new one", {
      status: 400,
    });
  await prisma.user.update({
    data: { email: verification.value, emailVerified: true },
    where: { id: verification.identifier },
  });
  await prisma.verification.delete({
    where: { id: verification.id },
  });
  return redirect("/profile");
}

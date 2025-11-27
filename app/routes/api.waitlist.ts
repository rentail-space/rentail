import { invariant } from "es-toolkit";
import sendWaitlistEmail from "~/emails/WaitlistEmail";
import prisma from "~/lib/prisma";
import type { Route } from "./+types/api.waitlist";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  invariant(email, "Email is required");

  await prisma.waitlist.createMany({
    data: [{ email }],
    skipDuplicates: true,
  });

  await sendWaitlistEmail({ email });
  return { success: true };
}

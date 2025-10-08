import { invariant } from "es-toolkit";
import { sendWaitlistEmail } from "~/emails/sendEmails";
import prisma from "~/lib/prisma";
import type { Route } from "./+types/api.waitlist";

export async function action({ request }: Route.ActionArgs) {
  const input = (await request.json()) as { email: string };
  invariant(input.email, "Email is required");

  await prisma.waitlist.createMany({
    data: [{ email: input.email }],
    skipDuplicates: true,
  });

  await sendWaitlistEmail({ email: input.email });
  return null;
}

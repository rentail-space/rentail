import { invariant } from "es-toolkit";
import Waitlist from "~/emails/Waitlist";
import prisma from "~/lib/prisma";
import { sendEmail } from "~/lib/resend";
import type { Route } from "./+types/api.waitlist";

export async function action({ request }: Route.ActionArgs) {
  const subject = "You're on the waitlist for Rentail";
  const input = (await request.json()) as { email: string };
  invariant(input.email, "Email is required");

  await prisma.waitlist.createMany({
    data: [{ email: input.email }],
    skipDuplicates: true,
  });

  await sendEmail({
    email: input.email,
    subject,
    component: ({ subject }) => <Waitlist subject={subject} />,
  });
  return null;
}

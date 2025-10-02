import { pretty, render } from "@react-email/components";
import { captureException } from "@sentry/react-router";
import { invariant } from "es-toolkit";
import { data } from "react-router";
import Waitlist from "~/emails/Waitlist";
import prisma from "~/lib/prisma";
import resend from "~/lib/resend";
import type { Route } from "./+types/api.waitlist";

export async function action({ request }: Route.ActionArgs) {
  const subject = "You're on the waitlist for Rentail";
  const html = await pretty(await render(<Waitlist subject={subject} />));
  const input = (await request.json()) as { email: string };
  invariant(input.email, "Email is required");

  await prisma.waitlist.createMany({
    data: [{ email: input.email }],
    skipDuplicates: true,
  });

  const { error } = await resend.emails.send({
    from: "Rentail <hello@rentail.space>",
    html,
    subject,
    to: [input.email],
  });
  if (error) captureException(error, { extra: { email: input.email } });
  return data({ error }, { status: error ? 400 : 200 });
}

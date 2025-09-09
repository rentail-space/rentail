import { pretty, render } from "@react-email/render";
import { data } from "react-router";
import { Resend } from "resend";
import invariant from "tiny-invariant";
import Waitlist from "~/emails/Waitlist";
import env from "~/lib/config";
import type { Route } from "./+types/api.waitlist";
import { captureException } from "@sentry/react-router";
import prisma from "~/lib/prisma";

const resend = new Resend(env.RESEND_API_KEY);

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
  if (error) captureException(error);
  return data({ error }, { status: error ? 400 : 200 });
}

import { pretty, render } from "@react-email/components";
import { captureException } from "@sentry/react-router";
import type { JSX } from "react";
import { Resend } from "resend";
import env from "~/lib/env";

const resend = new Resend(env.RESEND_API_KEY);

// Test-only: stores last sent email HTML for visual regression testing
export let lastEmailHtml: string | null = null;

export async function sendEmail({
  email,
  component,
  subject,
}: {
  email: string;
  component: ({ subject }: { subject: string }) => JSX.Element;
  subject: string;
}) {
  lastEmailHtml = null;
  try {
    const html = await pretty(await render(component({ subject })));
    lastEmailHtml = html;

    const { error } = await resend.emails.send({
      from: "Rentail <hello@rentail.space>",
      html,
      subject,
      to: [email],
    });
    if (error) throw error;

    console.info("[EMAIL] %s sent to %s", subject, email);
  } catch (error) {
    console.error("[EMAIL] Error sending %s email: %s", subject, error);
    captureException(error, { extra: { email } });
  }
}

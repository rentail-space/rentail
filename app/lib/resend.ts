import { pretty, render } from "@react-email/components";
import { captureException } from "@sentry/react-router";
import debug from "debug";
import type { JSX } from "react";
import { Resend } from "resend";
import env from "~/lib/env";

// Test-only: stores last sent email HTML for visual regression testing
export let lastEmailHtml: string | null = null;

const resend = new Resend(env.RESEND_API_KEY);
const logging = debug("email").enabled;

/**
 * Send an email using Resend. If an error occurs, it will be captured by Sentry.
 * The email will be stored in `lastEmailHtml` for visual regression testing.
 *
 * @param email - The email address to send the email to.
 * @param component - The React Email component to send.
 * @param subject - The subject of the email.
 */
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

    if (logging) console.info("[EMAIL] %s sent to %s", subject, email);
  } catch (error) {
    if (logging)
      console.error("[EMAIL] Error sending %s email: %s", subject, error);
    captureException(error, { extra: { email } });
  }
}

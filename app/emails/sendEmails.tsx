import { pretty, render } from "@react-email/components";
import { captureException } from "@sentry/react-router";
import debug from "debug";
import type { JSX } from "react";
import { Resend } from "resend";
import env from "~/lib/env";

// Test-only: stores last sent email HTML for visual regression testing
export let lastEmailHtml: string | null = null;
const resend = new Resend(env.RESEND_API_KEY);
const logger = debug("email");

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
    // In tests, we don't want to actually send emails, we just want to render them
    if (process.env.NODE_ENV === "test") return;

    const { error } = await resend.emails.send({
      from: "Rentail.space <hello@rentail.space>",
      html,
      subject,
      to: [email],
    });
    if (error) throw error;

    logger("%s sent to %s", subject, email);
  } catch (error) {
    captureException(error, { extra: { email } });
    console.error("Error sending %s email to %s: %s", subject, email, error);
  }
}

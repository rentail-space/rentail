import { pretty, render } from "@react-email/components";
import { captureException } from "@sentry/react-router";
import debug from "debug";
import type { JSX } from "react";
import { Resend } from "resend";
import env from "~/lib/env";
import EmailVerification from "./EmailVerification";
import Waitlist from "./Waitlist";
import Welcome from "./Welcome";

// Test-only: stores last sent email HTML for visual regression testing
export let lastEmailHtml: string | null = null;
const resend = new Resend(env.RESEND_API_KEY);
const logger = debug("email");

export async function sendWelcomeEmail({
  email,
  name,
}: {
  email: string;
  name: string;
}) {
  await sendEmail({
    component: ({ subject }) => <Welcome name={name} subject={subject} />,
    email,
    subject: "Welcome to rentail.space! 🎉",
  });
}

export async function sendVerificationEmail({
  email,
  name,
  url,
}: {
  email: string;
  name: string;
  url: string;
}) {
  await sendEmail({
    email,
    subject: "Verify your email address for rentail.space",
    component: ({ subject }) => (
      <EmailVerification name={name} subject={subject} url={url} />
    ),
  });
}

export async function sendWaitlistEmail({ email }: { email: string }) {
  await sendEmail({
    email,
    subject: "You're on the waitlist!",
    component: Waitlist,
  });
}

/**
 * Send an email using Resend. If an error occurs, it will be captured by Sentry.
 * The email will be stored in `lastEmailHtml` for visual regression testing.
 *
 * @param email - The email address to send the email to.
 * @param component - The React Email component to send.
 * @param subject - The subject of the email.
 */
async function sendEmail({
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

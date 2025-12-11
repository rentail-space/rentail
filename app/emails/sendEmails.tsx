import { pretty, render } from "@react-email/components";
import { captureException } from "@sentry/react-router";
import debug from "debug";
import { delay, invariant, withTimeout } from "es-toolkit";
import Redis from "ioredis";
import type { JSX } from "react";
import { Resend } from "resend";
import envVars from "~/lib/env";

export type LastEmail = {
  html: string;
  subject: string;
  to: string;
};

export let lastEmailSent: LastEmail | undefined = undefined;
const resend = new Resend(envVars.RESEND_API_KEY);
const logger = debug("email");

/**
 * Send an email using Resend. If an error occurs, it will be captured by Sentry.
 * The email will be stored in `lastEmailSent` for visual regression testing.
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
  lastEmailSent = undefined;
  try {
    const html = await pretty(await render(component({ subject })));
    await captureLastEmail({ html, to: email, subject });

    // In tests, we don't want to actually send emails, we just want to render them
    if (process.env.NODE_ENV !== "test") {
      const { error } = await resend.emails.send({
        from: "Rentail.space <hello@rentail.space>",
        html,
        subject,
        to: [email],
      });
      if (error) throw error;
    }

    logger("%s sent to %s", subject, email);
  } catch (error) {
    captureException(error, { extra: { email } });
    console.error("Error sending %s email to %s: %s", subject, email, error);
  }
}

/**
 * We use different processes for sending emails (Vite worker) and for checking
 * on them (test process), so we use Redis to communicate between the two.
 */
const subscriber = new Redis(envVars.REDIS_URL);
const publisher = new Redis(envVars.REDIS_URL);

subscriber.on("message", (channel: string, message: unknown) => {
  if (channel === "email:last")
    lastEmailSent = message
      ? (JSON.parse(message as string) as LastEmail)
      : undefined;
});
await subscriber.subscribe("email:last");

/**
 * Get the last email that was sent. This is useful for visual regression
 * testing. It is only available in test mode. This function will block until
 * the email is captured by the parent process.
 *
 * @returns The last email that was sent.
 */
export async function getLastEmailSent(): Promise<LastEmail> {
  await withTimeout(async () => {
    while (!lastEmailSent) await delay(100);
  }, 1_000);
  invariant(lastEmailSent, "No email sent");
  const lastEmail = lastEmailSent;
  lastEmailSent = undefined;
  return lastEmail;
}

/**
 * Capture the last email that was sent. This is used in the parent process to
 * capture the last email that was sent.
 *
 * @param html - The HTML of the email.
 * @param subject - The subject of the email.
 * @param to - The email address of the recipient.
 */
export async function captureLastEmail(lastEmail: LastEmail) {
  await publisher.publish("email:last", JSON.stringify(lastEmail));
}

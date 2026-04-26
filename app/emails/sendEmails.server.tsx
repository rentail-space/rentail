import { captureException } from "@sentry/react-router";
import { ms } from "convert";
import debug from "debug";
import { withTimeout } from "es-toolkit";
import Redis from "ioredis";
import { sleep } from "radashi";
import { pretty, render } from "react-email";
import { Resend } from "resend";
import invariant from "tiny-invariant";
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
 * @param content - The content of the email.
 * @param subject - The subject of the email.
 */
export async function sendEmail({
  email,
  content,
  subject,
}: {
  email: string;
  content: ({ subject }: { subject: string }) => React.ReactNode;
  subject: string;
}) {
  lastEmailSent = undefined;
  try {
    const html = await pretty(await render(content({ subject })));
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
 * Get the last email that was sent. This is useful for visual regression
 * testing. It is only available in test mode. This function will block until
 * the email is captured by the parent process.
 *
 * @returns The last email that was sent.
 */
export async function getLastEmailSent(): Promise<LastEmail> {
  const redis = new Redis(envVars.REDIS_URL);
  try {
    await withTimeout(async () => {
      while (true) {
        const raw = await redis.get("email:last");
        if (raw) {
          lastEmailSent = JSON.parse(raw) as LastEmail;
          return;
        }
        await sleep(100);
      }
    }, ms("10s"));
    await redis.del("email:last");
  } finally {
    await redis.quit();
  }
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
  const redis = new Redis(envVars.REDIS_URL);
  await redis.set("email:last", JSON.stringify(lastEmail));
  await redis.quit();
}

import { pretty, render } from "@react-email/components";
import { captureException } from "@sentry/react-router";
import { invariant } from "es-toolkit";
import type { Page } from "playwright/test";
import type { JSX } from "react";
import { Resend } from "resend";
import env from "~/lib/env";

const resend = new Resend(env.RESEND_API_KEY);
let lastEmail: string | null = null;

export async function sendEmail({
  email,
  component,
  subject,
}: {
  email: string;
  component: ({ subject }: { subject: string }) => JSX.Element;
  subject: string;
}) {
  try {
    const html = await pretty(await render(component({ subject })));
    lastEmail = html;

    const { error } = await resend.emails.send({
      from: "Rentail <hello@rentail.space>",
      html,
      subject,
      to: [email],
    });
    if (error) throw error;

    console.info("[EMAIL] %s sent to %s", subject, email);
  } catch (error) {
    lastEmail = null;
    console.error("[EMAIL] Error sending %s email: %s", subject, error);
    captureException(error, { extra: { email } });
  }
}

export async function renderLastEmailSent(page: Page) {
  invariant(lastEmail, "No email has been sent");

  // Create a full HTML page with the email content
  const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Waitlist Email</title>
          </head>
          <body style="margin: 0; padding: 20px;">
            ${lastEmail}
          </body>
        </html>
      `;

  // Set the page content and wait for it to load
  await page.setContent(fullHtml, { waitUntil: "networkidle" });

  lastEmail = null;
}

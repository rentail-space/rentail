import { pretty, render } from "@react-email/components";
import { invariant } from "es-toolkit";
import type { JSX } from "react";
import { expect } from "vitest";
import { context } from "./launchBrowser";

export default async function renderEmail(email: string | JSX.Element | null) {
  expect(email, "Email is required").toBeDefined();

  // Render the email component to HTML
  const html =
    typeof email === "string" ? email : await pretty(await render(email));

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
            ${html}
          </body>
        </html>
      `;

  // Set the page content and wait for it to load
  invariant(context, "No browser context");
  const page = await context.newPage();
  await page.setContent(fullHtml, { waitUntil: "networkidle" });
  return page;
}

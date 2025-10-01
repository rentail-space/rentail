import { pretty, render } from "@react-email/components";
import type { Page } from "playwright/test";

export default async function renderEmail(
  page: Page,
  element: React.ReactNode,
) {
  // Render the email component to HTML
  const html = await pretty(await render(element));

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
  await page.setContent(fullHtml, { waitUntil: "networkidle" });
}

import { pretty, render } from "@react-email/components";
import { invariant } from "es-toolkit";
import type { JSX } from "react";
import { newContext } from "./launchBrowser";

/**
 * Render an email component to HTML for visual regression testing. The email
 * can be a string, a JSX element, or a React Email component. Returns a
 * Playwright page with the email content.
 *
 * @param email - The email to render.
 * @returns The rendered email.
 */
export default async function renderEmail(email: string | JSX.Element | null) {
  invariant(email, "Email is required");

  const html =
    typeof email === "string" ? email : await pretty(await render(email));

  // Set the page content and wait for it to load (for images)
  const context = await newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 1024, height: 780 });
  await page.setContent(html, { waitUntil: "load" });
  return page;
}

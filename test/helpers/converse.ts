import { invariant, withTimeout } from "es-toolkit";
import type { Page } from "playwright";
import { expect } from "vitest";
import prisma from "~/lib/prisma";

/**
 * Converse with the chatbot. Send a message to the chatbot and wait for the
 * response to arrive, check that it renders on the page, and return the message
 * content.
 *
 * @param page - The Playwright page object.
 * @param message - The message to send to the chatbot.
 * @returns The response from the chatbot.
 */
export default async function converse(
  page: Page,
  message: string,
): Promise<string> {
  expect(page.url()).toContain("/chat");
  const initialCount = await prisma.messages.count();

  invariant(message.length > 5, "Message must be at least 5 characters long");
  await page.fill('input[type="text"]', message, { force: true, timeout: 100 });
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle");

  // Wait for server to update the database with the new messages
  await withTimeout(async () => {
    while (true) {
      const finalCount = await prisma.messages.count();
      if (finalCount >= initialCount + 2) break;
      await page.waitForTimeout(100);
    }
  }, 2_000);

  // Wait for the assistant response bubble to appear in the UI
  const lastResponseBubble = page.locator(".chat-bubble-response").last();
  await lastResponseBubble.waitFor({ state: "visible" });

  const lastResponseText = await lastResponseBubble.innerText();
  return lastResponseText;
}

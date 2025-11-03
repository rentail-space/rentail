import { delay, invariant, withTimeout } from "es-toolkit";
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
  invariant(message.length > 5, "Message must be at least 5 characters long");

  // NOTE: Make sure React is ready and reload to make sure the input field
  // triggers React events, otherwise this test will fail.
  expect(page.url()).toContain("/chat");
  await page.waitForFunction(() => "__reactRouterContext" in window);
  await page.reload({ waitUntil: "networkidle" });

  const initialCount = await prisma.messages.count();
  await page.fill('input[type="text"]', message);
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle");

  // NOTE: Wait just long enough to make sure the chat is streaming, and then
  // for it to finish streaming.
  await withTimeout(async () => {
    await delay(100);
    while (true) {
      const chat = await prisma.chat.findFirst();
      if (chat && chat.activeStreamId === null) break;
      await page.waitForTimeout(100);
    }
  }, 1_000);

  // We expect 2 new messages: one from the user, one from the assistant
  const currentCount = await prisma.messages.count();
  expect(currentCount).toBeGreaterThanOrEqual(initialCount + 2);

  // Wait for the assistant response bubble to appear in the UI
  const lastResponseBubble = page.locator(".chat-bubble-response").last();
  await lastResponseBubble.waitFor({ state: "visible" });

  const lastResponseText = await lastResponseBubble.innerText();
  return lastResponseText;
}

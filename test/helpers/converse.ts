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
  await page.fill('input[type="text"]', message, { force: true });
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle");

  // Wait for the stream to complete and working memory to be updated
  // The stream is finished when Chat.activeStreamId is set to null
  await withTimeout(async () => {
    while (true) {
      const chat = await prisma.chat.findFirst({
        select: { activeStreamId: true },
      });
      if (chat && chat.activeStreamId === null) break;
      await page.waitForTimeout(100);
    }
  }, 10_000);

  const finalCount = await prisma.messages.count();
  invariant(finalCount >= initialCount + 2, "Expected 2 new messages");

  // Wait for the assistant response bubble to appear in the UI
  const lastResponseBubble = page.locator(".chat-bubble-response").last();
  await lastResponseBubble.waitFor({ state: "visible" });

  const lastResponseText = await lastResponseBubble.innerText();
  return lastResponseText;
}

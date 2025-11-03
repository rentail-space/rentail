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

  // Wait for the page to be fully loaded and any Vite hot reloads to finish
  await page.waitForLoadState("networkidle");
  // Wait for potential Vite optimization reloads (these happen on first load)
  await page.waitForTimeout(200);

  // Type into the input - this properly triggers React events
  const input = page.locator('input[type="text"]');
  await input.click();
  await input.pressSequentially(message, { delay: 0 });
  expect(await input.inputValue()).toBe(message);

  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle");
  expect(await input.inputValue()).toBe("");

  // Wait for the messages to be saved to the database
  // We expect 2 new messages: one from the user, one from the assistant
  await withTimeout(async () => {
    while (true) {
      const currentCount = await prisma.messages.count();
      if (currentCount >= initialCount + 2) break;
      await page.waitForTimeout(10);
    }
  }, 1_000);

  // Wait for the assistant response bubble to appear in the UI
  const lastResponseBubble = page.locator(".chat-bubble-response").last();
  await lastResponseBubble.waitFor({ state: "visible" });

  const lastResponseText = await lastResponseBubble.innerText();
  return lastResponseText;
}

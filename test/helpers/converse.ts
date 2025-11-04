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
  expect(page.url()).toContain("/chat");
  const initialCount = await prisma.messages.count();
  const responseBubbles = await page.locator(".chat-bubble-response").count();

  invariant(message.length > 5, "Message must be at least 5 characters long");

  // Wait for the page to be fully loaded
  await page.waitForLoadState("networkidle");

  // Type into the input - this properly triggers React events
  const input = page.locator('input[type="text"]');
  await input.click();
  await input.pressSequentially(message, { delay: 0 });
  expect(await input.inputValue()).toBe(message);

  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle");
  expect(await input.inputValue()).toBe("");

  // Wait for the new response bubble to appear
  await page.waitForSelector(
    `.chat-bubble-response:nth-child(${responseBubbles + 1})`,
    { state: "visible" },
  );

  // Wait for the assistant to finish streaming
  await withTimeout(async () => {
    while (true) {
      const chat = await prisma.chat.findFirst();
      console.log("chat", chat?.activeStreamId);
      if (chat && chat.activeStreamId === null) break;
      await delay(1000);
    }
  }, 30_000);

  // We expect 2 new messages: one from the user, one from the assistant
  const currentCount = await prisma.messages.count();
  expect(currentCount).toBeGreaterThanOrEqual(initialCount + 2);

  // Wait for the assistant response bubble to appear in the UI
  return page.locator(".chat-bubble-response").last().innerText();
}

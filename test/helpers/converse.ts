import { withTimeout } from "es-toolkit";
import type { Page } from "playwright";
import { expect } from "vitest";
import prisma from "~/lib/prisma";
import { goto } from "./launchBrowser";

/**
 * Converse with the chatbot. Send a message to the chatbot and wait for the
 * response to arrive. Check that it renders on the page.
 *
 * @param message - The message to send to the chatbot.
 * @param headers - The headers to set on the page (optional).
 * @returns The page.
 */
export default async function converse(
  message: string,
  headers?: HeadersInit,
): Promise<Page> {
  const page = await goto("/chat", headers);

  // Get the initial count of messages in the database, we expect 2 new messages.
  const messageCount = await prisma.messages.count();
  // Count response bubbles on the page, we expect 1 new response bubble.
  // There's always at least one response bubble, the welcome message.
  const responseCount = await page.locator(".chat-bubble-response").count();

  // NOTE: We need to focus on the input and then type text into it, which
  // properly triggers React events.
  const input = page.locator('input[type="text"]');
  await input.clear();
  await input.focus();
  await input.pressSequentially(message);
  // Sanity check that we got the correct message in the input.
  expect(await input.inputValue()).toBe(message);

  // Press Enter to trigger form submission
  // This fires a native submit event that React's event delegation system catches
  await input.press("Enter");

  // After submitting, verify the input is empty (submission succeeded)
  // Wait a bit for React state to update
  expect(await input.inputValue()).toBe("");

  // Wait for the new assistant response bubble to appear.
  await page.waitForFunction(
    (count) =>
      document.querySelectorAll(".chat-bubble-response").length >= count,
    responseCount + 1,
    { timeout: 10_000 },
  );

  // Wait for the assistant to finish streaming. It should have completed by
  // now, but this is a sanity check. This test fails if we handle streaming
  // incorrectly on the server.
  await withTimeout(async () => {
    while (true) {
      const chat = await prisma.chat.findFirst({
        select: { activeStreamId: true },
      });
      if (chat && chat.activeStreamId === null) break;
      await page.waitForTimeout(100);
    }
  }, 10_000);

  // We expect at least 2 new messages: one from the user and one from the assistant
  expect(await prisma.messages.count()).toBeGreaterThanOrEqual(
    messageCount + 2,
  );

  // We expect a new assistant response bubble to appear.
  expect(
    await page.locator(".chat-bubble-response").count(),
  ).toBeGreaterThanOrEqual(responseCount + 1);

  return page;
}

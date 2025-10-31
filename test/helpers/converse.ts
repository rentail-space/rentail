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
  await page.getByRole("textbox").fill(message);
  await page.getByRole("button", { name: "Send" }).click();
  await page.waitForLoadState("networkidle");

  // Wait for the stream to complete by polling activeStreamId
  expect(await prisma.chat.count()).toEqual(1);
  while (true) {
    const chat = await prisma.chat.findFirstOrThrow({
      select: { activeStreamId: true },
    });
    if (!chat.activeStreamId) break;
    await page.waitForTimeout(100);
  }

  // Wait for the assistant response bubble to appear in the UI
  const lastResponseBubble = page.locator(".chat-bubble-response").last();
  await lastResponseBubble.waitFor({ state: "visible" });

  const lastResponseText = await lastResponseBubble.innerText();
  return lastResponseText;
}

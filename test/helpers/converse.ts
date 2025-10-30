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

  expect(await prisma.chat.count()).toEqual(1);
  while (true) {
    const chat = await prisma.chat.findFirstOrThrow();
    if (chat.activeStreamId === null) break;
    await page.waitForTimeout(100);
  }

  const lastResponseBubble = page.locator(".chat-bubble").last();
  await lastResponseBubble.waitFor({ state: "visible" });

  const className = await lastResponseBubble.getAttribute("class");
  expect(className).toContain("chat-bubble-response");

  const lastResponseText = await lastResponseBubble.innerText();
  console.log("**********", lastResponseText);
  return lastResponseText;
}

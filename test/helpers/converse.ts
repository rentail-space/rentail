import { delay } from "es-toolkit";
import type { Page } from "playwright";
import prisma from "~/lib/prisma";
import { goto } from "./launchBrowser";

export default async function converse(
  message: string,
  headers?: HeadersInit,
): Promise<Page> {
  const page = await goto("/chat", headers);
  await page.getByRole("textbox").fill(message);
  await page.getByRole("button", { name: "Send" }).click();
  await delay(100);

  while (true) {
    const chat = await prisma.chat.findFirst({});
    if (chat?.activeStreamId == null) break;
    await delay(100);
  }
  return page;
}

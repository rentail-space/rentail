import { delay } from "es-toolkit";
import type { Page } from "playwright";
import prisma from "~/lib/prisma";

export default async function converse(
  page: Page,
  message: string,
): Promise<void> {
  await page.getByRole("textbox").fill(message);
  await page.getByRole("button", { name: "Send" }).click();
  await delay(100);

  while (true) {
    const chat = await prisma.chat.findFirst({});
    if (chat?.activeStreamId == null) break;
    await delay(100);
  }
  console.log(await prisma.messages.findMany({}));
}

import { convertToModelMessages, generateObject } from "ai";
import { DateTime } from "luxon";
import type { UserGetPayload } from "prisma/generated/models";
import zod from "zod";
import sendDailyAlertEmail from "~/emails/EmailDailyAlert";
import { classifyModel } from "~/lib/model";
import preparePrompt from "~/lib/preparePrompt";
import prisma from "~/lib/prisma";
import dailyAlertPrompt from "~/prompts/dailyAlertPrompt.md?raw";
import { recentMessages } from "~/sessions.server";

export async function loader() {
  const users = await prisma.user.findMany({
    include: { chats: true },
    where: {
      OR: [
        { lastAlertAt: { lte: DateTime.now().minus({ weeks: 1 }).toJSDate() } },
        { lastAlertAt: null },
      ],
    },
  });
  for (const user of users) {
    const alert = await findAlert(user);
    console.info("Sending alert to %s\n%o", user.email, alert);
    await prisma.user.update({
      data: { lastAlertAt: new Date() },
      where: { id: user.id },
    });
    await sendDailyAlertEmail(alert);
  }
  return new Response();
}

const Alert = zod
  .object({
    message: zod.string().describe("The message to send to the merchant"),
    subject: zod.string().describe("The subject of the alert"),
    helpful: zod
      .boolean()
      .describe("Will this alert help the merchant make more money?"),
    center: zod
      .string()
      .optional()
      .describe(
        "If this alert is about a shopping center, the shopping center's ID",
      ),
    space: zod
      .string()
      .optional()
      .describe("If this alert is about a space, the space's ID"),
  })
  .describe(
    "A list of alerts that we found interesting and important to send to the merchant",
  );

async function findAlert(
  user: UserGetPayload<{ include: { chats: true } }>,
): Promise<zod.infer<typeof Alert>> {
  const chatId = user.chats[0].id;
  const messages = await recentMessages(chatId);
  const system = await preparePrompt({
    prompt: dailyAlertPrompt,
    headers: new Headers(),
    user,
  });

  const response = await generateObject({
    messages: convertToModelMessages(messages),
    model: classifyModel,
    system: system,
    providerOptions: {
      anthropic: {
        cacheControl: { type: "ephemeral", ttl: "1h" },
        temperature: 0.0,
      },
    },
    schema: Alert,
  });
  return response.object;
}

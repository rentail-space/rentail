import { convertToModelMessages, generateObject, generateText } from "ai";
import debug from "debug";
import type { User } from "prisma/generated/client";
import { ulid } from "ulid";
import { beforeAll, it } from "vitest";
import zod from "zod";
import { conversationalModel } from "~/lib/model";
import preparePrompt from "~/lib/preparePrompt";
import prisma from "~/lib/prisma";
import updateWorkingMemory from "~/lib/workingMemory";
import chatPrompt from "~/prompts/chatPrompt.md?raw";
import { findOrCreateUser, recentMessages } from "~/sessions.server";

const logger = debug("conversations");

/**
 * Prepare a conversational test with a script that alternates between user
 * sending messages, and classifying the assistant's response.
 *
 * Example:
 * ```
 *   runThroughScript({
 *     headers: {
 *       "x-vercel-ip-latitude": "47.608013",
 *       "x-vercel-ip-longitude": "-122.335167",
 *     },
 *     script,
 *   });
 * ```
 *
 * @param headers - The HTTP headers
 * @param script - The script to run through the chatbot.
 */
export default async function runThroughScript({
  headers,
  script,
}: {
  headers?: Record<string, string>;
  script: string;
}): Promise<void> {
  const chatId = ulid();
  let user: User;
  let prompt: string;

  const messages = script
    .split("---")
    .map((part) => {
      const [_, role] = part.trim().match(/^(\w+):$/m) ?? [];
      const content = part.trim().replace(/^(\w+):$/m, "");
      return { role, content };
    })
    .map(({ content, role }) => ({
      content: content.replace(/^(\w+):$/m, ""),
      role,
    }));

  beforeAll(async () => {
    await prisma.user.deleteMany();

    const found = await findOrCreateUser({
      chatId,
      requestHeaders: new Headers(headers),
    });
    user = found.user;

    prompt = await preparePrompt({
      headers: new Headers(headers),
      prompt: chatPrompt,
      user,
    });

    for (const { content, role } of messages)
      if (role.match(/User/i))
        await generateAssistantResponse({
          chatId,
          prompt,
          user,
          userInput: content,
        });
  });

  for (const [index, { content, role }] of messages.entries())
    if (role.match(/Assistant/i))
      it.skipIf(process.env.CI)(
        `should respond to the user ${content}`,
        async () =>
          classifyAssistantResponse({ chatId, index, expecting: content }),
      );
}

async function generateAssistantResponse({
  chatId,
  prompt,
  user,
  userInput,
}: {
  chatId: string;
  prompt: string;
  user: User;
  userInput: string;
}): Promise<void> {
  await addMessage({ chatId, role: "user", content: userInput });

  const response = await generateText({
    messages: convertToModelMessages(await recentMessages(chatId)),
    model: conversationalModel,
    system: prompt,
    providerOptions: {
      anthropic: {
        cacheControl: { type: "ephemeral", ttl: "1h" },
        temperature: 0.0,
      },
    },
  });
  await addMessage({ chatId, role: "assistant", content: response.text });
  await prisma.user.update({
    where: { id: user.id },
    data: {
      workingMemory: await updateWorkingMemory({
        messages: await recentMessages(chatId),
        workingMemory: user.workingMemory ?? "",
      }),
    },
  });
}

async function classifyAssistantResponse({
  chatId,
  index,
  expecting,
}: {
  chatId: string;
  index: number;
  expecting: string;
}): Promise<void> {
  const messages = (await recentMessages(chatId)).slice(0, index + 1);
  const classified = await generateObject({
    messages: convertToModelMessages(messages),
    model: conversationalModel,
    system: `
  This is a sequence of messages between a user and an assistant.
  The first message is a welcome message from the assistant.
  The last message is a response from the assistant to the user.
  Your job is to analyze the last message in the sequence (the assistant's
  response) and determine if the following applies:

  ${expecting
    .split("\n")
    .map((line) => `<rule>${line}</rule>`)
    .join("\n")}

  The rule is interpreted as "does the assistant _______?"
  If the rules apply, return "yes".
  If the rules do not apply, return "no".
  If the rules are not clear, return "unknown".
  If the rules are not applicable, return "no".
  `,
    providerOptions: {
      anthropic: {
        cacheControl: { type: "ephemeral", ttl: "1h" },
        temperature: 0.0,
      },
    },
    schema: zod.object({
      questions: zod.array(
        zod.object({
          question: zod.string(),
          answer: zod.enum(["yes", "no", "unknown"]),
        }),
      ),
    }),
  });

  logger(
    "\n\x1b[34m%s\n\nExpecting:\n%s\n\n%s\x1b[0m",
    messages
      .map(
        (message) =>
          `[${message.role}] ${message.parts
            .map((part) => (part.type === "text" ? part.text : ""))
            .join(" ")
            .trim()}`,
      )
      .join("\n"),
    expecting.trim(),
    classified.object.questions
      .map(({ question, answer }) => `Q: ${question} => ${answer}`)
      .join("\n"),
  );

  const allCorrect = classified.object.questions.every(
    ({ answer }) => answer === "yes",
  );
  if (!allCorrect) {
    const allAnswers = classified.object.questions
      .map(({ question, answer }) => `Q: ${question} => ${answer}`)
      .join("\n");
    throw new Error(allAnswers);
  }
}

async function addMessage({
  chatId,
  role,
  content,
}: {
  chatId: string;
  role: "assistant" | "user";
  content: string;
}) {
  await prisma.messages.create({
    data: {
      chatId,
      content: [{ type: "text", text: content }],
      id: ulid(),
      role,
      type: "text",
    },
  });
}

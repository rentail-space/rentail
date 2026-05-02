import type { User } from "prisma/generated";
import { Output, convertToModelMessages, generateText } from "ai";
import { findOrCreateUser, recentMessages } from "~/lib/sessions.server";
import { beforeAll, it } from "vitest";
import { classify } from "~/lib/models";
import { last } from "radashi";
import { ulid } from "ulid";
import updateWorkingMemory from "~/lib/workingMemory";
import preparePrompt from "~/lib/preparePrompt.server";
import prisma from "~/lib/prisma.server";
import debug from "debug";
import zod from "zod";

const logger = debug("server:conversations");

/**
 * Prepare a conversational test with a script that alternates between user
 * sending messages, and classifying the assistant's response.
 *
 * Example:
 * ```
 *   runThroughScript({
 *     headers: {
 *       "x-real-ip": "127.0.0.1",
 *       "x-ip-city": "Los Angeles",
 *       "x-ip-latitude": "47.608013",
 *       "x-ip-longitude": "-122.335167",
 *     },
 *     script: `
 *       Assistant:
 *         [ ] Welcomes the user
 *
 *       User: Hello, how are you?
 *
 *       Assistant:
 *         [ ] Responds to the user
 *         [ ] Finishes with a question`
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

  const messages = script
    .split("\n\n")
    .map((part) => part.trim())
    .map((part) => {
      const [_, role] = part.trim().match(/^(\w+):(?:\s|$)/m) ?? [];
      const content = part
        .trim()
        .replace(/^(\w+):/m, "")
        .trim();
      return { role, content };
    });

  beforeAll(async () => {
    await prisma.user.deleteMany();
    await findOrCreateUser({ chatId, requestHeaders: new Headers(headers) });

    for (const { content, role } of messages) {
      if (!role.match(/User/i)) continue;
      const user = await prisma.user.findFirstOrThrow();
      const prompt = await preparePrompt({
        headers: new Headers(headers),
        user,
      });
      await generateAssistantResponse({
        chatId,
        prompt,
        user,
        userInput: content,
      });
    }
  });

  for (const [index, { content, role }] of messages.entries()) {
    if (!role.match(/Assistant/i)) continue;
    it(`should respond to the user ${content}`, () =>
      classifyAssistantResponse({ chatId, index, expecting: content }));
  }
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
    messages: await convertToModelMessages(await recentMessages(chatId)),
    system: prompt,
    ...classify,
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
  const { output: questions } = await generateText({
    messages: await convertToModelMessages(messages),
    system: `
  This is a sequence of messages between a user and an assistant.
  The first message is a welcome message from the assistant.
  The last message is a response from the assistant to the user.
  Your job is to analyze the last message in the sequence (the assistant's
  response) and determine if the following applies.
  I am only looking at this rules:

  ${expecting
    .trim()
    .split("\n")
    .map((line) => `<rule>${line}</rule>`)
    .join("\n")}

  Do not make up any rules. Only return "yes" or "no" based on the rules.
  Each rule is interpreted as "does the assistant _______?"
  If any rule applies, return "yes".
  If any rule does not apply, return "no".
  `,
    output: Output.array({
      element: zod.object({
        question: zod.string(),
        answer: zod.enum(["yes", "no", "unknown"]),
      }),
    }),
    ...classify,
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
    expecting
      .split("\n")
      .map((line) => line.trim())
      .join("\n"),
    questions
      .map(({ question, answer }) => `Q: ${question} => ${answer}`)
      .join("\n"),
  );

  const allCorrect = questions.every(({ answer }) => answer === "yes");
  if (!allCorrect) {
    const allAnswers = questions
      .map(({ question, answer }) => `Q: ${question} => ${answer}`)
      .join("\n");
    const lastMessage = last(messages)
      ?.parts.map((part) => (part.type === "text" ? part.text : ""))
      .join(" ")
      .trim();
    throw new Error(`${lastMessage}\n\n${allAnswers}`);
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

import { convertToModelMessages, generateObject, generateText } from "ai";
import debug from "debug";
import { last } from "es-toolkit";
import type { User } from "prisma/generated/client";
import { ulid } from "ulid";
import { beforeAll, it } from "vitest";
import zod from "zod";
import { classifyModel } from "~/lib/model";
import preparePrompt from "~/lib/preparePrompt";
import prisma from "~/lib/prisma";
import updateWorkingMemory from "~/lib/workingMemory";
import chatPrompt from "~/prompts/chatPrompt.md?raw";
import welcome from "~/prompts/welcome.md?raw";
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
  beforeAll(async () => {
    await prisma.user.deleteMany();

    const found = await findOrCreateUser({
      chatId,
      requestHeaders: new Headers(headers),
    });
    user = found.user;

    // Always start with the welcome message
    await addMessage({ chatId, role: "assistant", content: welcome });

    prompt = await preparePrompt({
      headers: new Headers(headers),
      prompt: chatPrompt,
      user,
    });
  });

  const parts = script.split("---");
  for (const part of parts) {
    const [_, role] = part.trim().match(/^(\w+):$/m) ?? [];
    const content = part.replace(/^(\w+):$/m, "");
    const combined = content.replaceAll(/\n/gm, " ");
    switch (role.trim()) {
      case "Assistant": {
        it.skipIf(process.env.CI)(
          `should respond to the user ${combined}`,
          async () => classifyAssistantResponse({ chatId, expecting: content }),
        );
        break;
      }

      case "User": {
        it.skipIf(process.env.CI)(
          `should ask the chatbot ${combined}`,
          async () =>
            generateAssistantResponse({
              chatId,
              userInput: content,
              prompt,
              user,
            }),
        );
        break;
      }

      default:
        throw new Error(`Unknown role: ${role}`);
    }
  }
}

async function classifyAssistantResponse({
  chatId,
  expecting,
}: {
  chatId: string;
  expecting: string;
}): Promise<void> {
  const messages = await recentMessages(chatId);
  const classified = await generateObject({
    messages: convertToModelMessages(messages),
    model: classifyModel,
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
  if (logger.enabled) {
    logger(
      "\n\x1b[34mAssistant:\n%s\n\nExpecting:\n%s\n\n%s\x1b[0m",
      last(messages)
        ?.parts.map((part) => (part.type === "text" ? part.text : ""))
        .join(" "),
      expecting.trim(),
      classified.object.questions
        .map(({ question, answer }) => `Q: ${question} => ${answer}`)
        .join("\n"),
    );
  }

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

async function generateAssistantResponse({
  chatId,
  userInput,
  prompt,
  user,
}: {
  chatId: string;
  userInput: string;
  prompt: string;
  user: User;
}): Promise<void> {
  await addMessage({ chatId, role: "user", content: userInput });

  const response = await generateText({
    messages: convertToModelMessages(await recentMessages(chatId)),
    model: classifyModel,
    //mmodel: conversationalModel,
    system: prompt,
    providerOptions: {
      anthropic: {
        cacheControl: { type: "ephemeral", ttl: "1h" },
        temperature: 0.0,
      },
    },
  });

  await addMessage({ chatId, role: "assistant", content: response.text });
  logger("\n\x1b[34mUser:\n%s\x1b[0m", userInput.trim());

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

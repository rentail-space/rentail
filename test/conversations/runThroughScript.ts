import { type ModelMessage, generateObject, generateText } from "ai";
import debug from "debug";
import type { User } from "prisma/generated/client";
import { type TestAPI, beforeAll, it } from "vitest";
import zod from "zod";
import { classifyModel, conversationalModel } from "~/lib/model";
import preparePrompt from "~/lib/preparePrompt";
import chatPrompt from "~/prompts/chatPrompt.md?raw";
import welcome from "~/prompts/welcome.md?raw";

const logger = debug("conversations");

export default async function runThroughScript({
  headers,
  script,
  test,
  user,
}: {
  headers?: Record<string, string>;
  script: string;
  test: TestAPI;
  user?: User;
}): Promise<void> {
  // Always start with the welcome message
  const messages: ModelMessage[] = [{ role: "assistant", content: welcome }];

  let prompt: string;
  beforeAll(async () => {
    prompt = await preparePrompt({
      headers: new Headers(headers),
      user,
      prompt: chatPrompt,
    });
  });

  test.runIf(!process.env.CI);

  const parts = script.split("---");
  for (const part of parts) {
    const [_, role] = part.trim().match(/^(\w+):$/m) ?? [];
    const content = part.replace(/^(\w+):$/m, "");
    const combined = content.replaceAll(/\n/gm, " ");
    switch (role.trim()) {
      case "Assistant": {
        it(`should respond to the user ${combined}`, async () =>
          classifyAssistantResponse({ content, messages }));
        break;
      }

      case "User": {
        it(`should ask the chatbot ${combined}`, async () =>
          generateAssistantResponse({ content, messages, prompt }));
        break;
      }

      default:
        throw new Error(`Unknown role: ${role}`);
    }
  }
}

async function classifyAssistantResponse({
  content,
  messages,
}: {
  content: string;
  messages: ModelMessage[];
}): Promise<void> {
  const response = await generateObject({
    messages,
    model: classifyModel,
    system: `
  This is a sequence of messages between a user and an assistant.
  The first message is a welcome message from the assistant.
  The last message is a response from the assistant to the user.
  Your job is to analyze the last message in the sequence and determine
  if the following applies:

  ${content
    .split("\n")
    .map((line) => `<rule>${line}</rule>`)
    .join("\n")}

  If the rules apply, return "yes". If the rules do not apply, return "no".
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
    for (const { question, answer } of response.object.questions)
      logger(`Q: ${question} => ${answer}`);
  }

  const allCorrect = response.object.questions.every(
    ({ answer }) => answer === "yes",
  );
  if (!allCorrect) {
    const allAnswers = response.object.questions
      .map(({ question, answer }) => `Q: ${question} => ${answer}`)
      .join("\n");
    throw new Error(allAnswers);
  }
}

async function generateAssistantResponse({
  content,
  messages,
  prompt,
}: {
  content: string;
  messages: ModelMessage[];
  prompt: string;
}): Promise<void> {
  messages.push({ role: "user", content });
  const response = await generateText({
    messages,
    model: conversationalModel,
    system: prompt,
    providerOptions: {
      anthropic: {
        cacheControl: { type: "ephemeral", ttl: "1h" },
        temperature: 0.0,
      },
    },
  });
  messages.push({ role: "assistant", content: response.text });
  logger("User: %s\n=> %s", content.trim(), response.text.trim());
}

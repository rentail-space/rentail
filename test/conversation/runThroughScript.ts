import { createAnthropic } from "@ai-sdk/anthropic";
import { type ModelMessage, generateObject, generateText } from "ai";
import debug from "debug";
import { readFileSync } from "node:fs";
import type { User } from "prisma/generated/client";
import { beforeAll, it } from "vitest";
import zod from "zod";
import env from "~/lib/env";
import systemPrompt from "~/lib/systemPrompt";
import welcome from "~/prompts/welcome.md?raw";

const logger = debug("conversation");

export default async function runThroughScript({
  filename,
  headers,
  user,
}: {
  filename: string;
  headers?: Record<string, string>;
  user?: User;
}): Promise<void> {
  const script = readFileSync(
    import.meta.resolve(filename).replace(/^file:\/\//, ""),
    "utf-8",
  );
  const model = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })(
    "claude-haiku-4-5",
  );
  const messages: ModelMessage[] = [{ role: "assistant", content: welcome }];

  let prompt: string;
  beforeAll(async () => {
    prompt = await systemPrompt({ headers: new Headers(headers), user });
  });

  const parts = script.split("---");
  for (const part of parts) {
    const [_, role] = part.trim().match(/^(\w+):$/m) ?? [];
    const content = part.replace(/^(\w+):$/m, "");
    const combined = content.replaceAll(/\n/gm, " ");
    switch (role.trim()) {
      case "Assistant": {
        it.runIf(!process.env.CI)(
          `should respond to the user ${combined}`,
          async () => {
            const response = await generateObject({
              messages,
              model,
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
              schema: zod.object({
                questions: zod.array(
                  zod.object({
                    question: zod.string(),
                    answer: zod.enum(["yes", "no", "unknown"]),
                  }),
                ),
              }),
            });
            logger("Assistant: %s\n=> %s", content, response.object.questions);

            const allCorrect = response.object.questions.every(
              ({ answer }) => answer === "yes",
            );
            if (!allCorrect) {
              const allAnswers = response.object.questions
                .map(({ question, answer }) => `Q: ${question} => ${answer}`)
                .join("\n");
              throw new Error(allAnswers);
            }
          },
        );
        break;
      }

      case "User": {
        it.runIf(!process.env.CI)(
          `should ask the chatbot ${combined}`,
          async () => {
            messages.push({ role: "user", content });
            const response = await generateText({
              messages,
              model,
              system: prompt,
            });
            messages.push({ role: "assistant", content: response.text });
            logger("User: %s\n=> %s", content, response.text);
          },
        );
        break;
      }

      default:
        throw new Error(`Unknown role: ${role}`);
    }
  }
}

import { createAnthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { last, partition, takeRightWhile } from "es-toolkit";
import invariant from "tiny-invariant";
import config from "~/lib/config";
import prisma from "~/lib/prisma";
import general from "../lib/general.md?raw";
import spaces from "../lib/spaces.md?raw";
import type { Route } from "./+types/api.chat";

invariant(general, "General prompt is required");
invariant(spaces, "Centers list is required");

export async function action({ request }: Route.ActionArgs) {
  const conversationId = request.headers.get("X-Conversation-Id");
  invariant(conversationId, "Conversation ID is required");

  const { messages }: { messages: UIMessage[] } = await request.json();

  // Store the new messages from the user or assistant
  for (const message of messages) {
    await prisma.message.upsert({
      create: {
        content: combine(message.parts),
        id: message.id,
        conversationId,
        role: message.role === "user" ? "USER" : "ASSISTANT",
      },
      update: {},
      where: { id: message.id },
    });
  }

  // Send last message to Anthropic LLM
  const model = createAnthropic({ apiKey: config.ANTHROPIC_API_KEY })(
    "claude-sonnet-4-20250514",
  );
  const result = streamText({
    messages: convertToModelMessages(messages),
    model,
    providerOptions: {
      anthropic: { thinking: { budgetTokens: 12000, type: "disabled" } },
    },
    system: [general, spaces].join("\n\n=====\n\n"),
  });

  // Store the response from the LLM as last message from assistant.
  // Wait until Anthropic LLM has finished generating the response.
  result.content.then((content) =>
    prisma.message.create({
      data: {
        content: combine(content),
        conversationId,
        role: "ASSISTANT",
      },
    }),
  );

  // Stream the response to the client
  return result.toUIMessageStreamResponse();
}

function combine(content: Array<{ type: string; text?: string }>) {
  return content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("\n");
}

/**
 * {
 *   "id":"Nv2i6Na7LGdM4QLx",
 *   "messages":[
 *     {
 *       "parts":[{"text":"Welcome to **rentail.space**!\n\nI'm your virtual assistant here to help you find the perfect retail space for\nyour business needs.  How can I assist you today?"}],
 *       "role":"assistant"
 *     },
 *     {
 *       "parts":[{"text":"What are the available retail spaces?"}],
 *       "role":
 *       "user","id":"RNf0kp5K0xhgmH3O"
 *     }
 *   ],
 *   "trigger":"submit-message"
 * }
 */

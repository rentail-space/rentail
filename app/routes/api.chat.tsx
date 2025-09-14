import { createAnthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  streamText,
  type UIMessage,
  validateUIMessages,
} from "ai";
import type { Conversation } from "prisma/generated/client";
import invariant from "tiny-invariant";
import env from "~/lib/env";
import prisma from "~/lib/prisma";
import { getConversationFromSession } from "~/sessions.server";
import general from "../lib/general.md?raw";
import spaces from "../lib/spaces.md?raw";
import type { Route } from "./+types/api.chat";

// @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence

invariant(general, "General prompt is required");
invariant(spaces, "Centers list is required");

export async function action({ request }: Route.ActionArgs) {
  const { conversation } = await getConversationFromSession(request);
  const { messages }: { messages: UIMessage[] } = await request.json();

  // Store the new messages from the user.
  await saveMessages({ conversation, messages });

  // Send last message to Anthropic LLM
  const model = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })(
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

  // consume the stream to ensure it runs to completion & triggers onFinish
  // even when the client response is aborted:
  result.consumeStream(); // no await

  // Stream the response to the client, always save the last message(s) from the
  // assistant.
  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ messages }) =>
      await saveMessages({ conversation, messages }),
  });
}

async function saveMessages({
  conversation,
  messages,
}: {
  conversation: Conversation;
  messages: UIMessage[];
}): Promise<void> {
  await prisma.message.createMany({
    data: messages.map((message) => ({
      content: combine(message.parts),
      conversationId: conversation.id,
      id: message.id,
      role: message.role === "user" ? "USER" : "ASSISTANT",
    })),
    skipDuplicates: true,
  });
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

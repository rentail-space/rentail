import type { UIMessage, UITools } from "ai";
import { last } from "es-toolkit";
import type { Message } from "prisma/generated/client";
import type { MessageGetPayload } from "prisma/generated/models";

// On the client side, messages are based on UIMessage with our own metadata,
// tools, etc. In the database we store in Prisma Message format.
export type ClientMessage = UIMessage<
  { isAborted?: boolean },
  { text: string },
  UITools
>;

/**
 * Convert an array of Prisma Messages to an array of Client Messages with multiple parts.
 *
 * @param messages The messages to convert.
 * @returns The converted messages.
 */
export function toClientMessages(messages: Message[]): ClientMessage[] {
  return messages.reduce((all, message) => {
    // Split {message.id}.{index} to {message.id} so we can roll parts together
    const messageId = message.messageId.split(":")[0];
    const lastMessage = last(all);
    const lastMessageId = lastMessage?.id.split(":")[0];
    if (lastMessage && lastMessageId === messageId)
      lastMessage.parts.push(...toMessageParts(message));
    else
      all.push({
        id: messageId,
        metadata: { isAborted: message.isAborted },
        parts: toMessageParts(message),
        role: message.role === "USER" ? "user" : "assistant",
      });
    return all;
  }, [] as ClientMessage[]);
}

function toMessageParts(message: Message): ClientMessage["parts"] {
  return message.content
    ? [{ text: message.content, type: "text" }]
    : message.reasoning
      ? [{ text: message.reasoning, type: "reasoning" }]
      : [];
}

// Convert a UI Message to one or more Prisma Message
export function fromClientMessage(message: ClientMessage): MessageGetPayload<{
  omit: { createdAt: true; chatId: true; id: true };
}>[] {
  return message.parts
    .filter(({ type }) => type === "text" || type === "reasoning")
    .map((part, index) => ({
      content: part.type === "text" ? part.text : null,
      messageId: `${message.id}:${index}`,
      isAborted: message.metadata?.isAborted ?? false,
      reasoning: part.type === "reasoning" ? part.text : null,
      role: message.role === "user" ? "USER" : "ASSISTANT",
    }));
}

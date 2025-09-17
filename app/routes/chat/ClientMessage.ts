import type { UIMessage, UITools } from "ai";
import type { Message } from "prisma/generated/client";

// On the client side, messages are based on UIMessage with our own metadata,
// tools, etc. In the database we store in Prisma Message format.
export type ClientMessage = UIMessage<
  { isAborted?: boolean },
  { text: string },
  UITools
>;

// Convert a Prisma Message to a UI Message
export function toClientMessage(message: Message): ClientMessage {
  return {
    id: message.id,
    role: message.role === "USER" ? "user" : "assistant",
    parts: message.content
      ? [{ text: message.content, type: "text" }]
      : message.reasoning
        ? [{ text: message.reasoning, type: "reasoning" }]
        : [],
  };
}

// Convert a UI Message to one or more Prisma Message
export function fromClientMessage(
  message: ClientMessage,
): Omit<Message, "conversationId">[] {
  return message.parts.map((part) => ({
    content: part.type === "text" ? part.text : null,
    createdAt: new Date(),
    id: message.id,
    isAborted: message.metadata?.isAborted ?? false,
    reasoning: part.type === "reasoning" ? part.text : null,
    role: message.role === "user" ? "USER" : "ASSISTANT",
  }));
}

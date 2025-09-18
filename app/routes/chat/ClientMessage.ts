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
    metadata: { isAborted: message.isAborted },
    parts: message.content
      ? [{ text: message.content, type: "text" }]
      : message.reasoning
        ? [{ text: message.reasoning, type: "reasoning" }]
        : [],
    role: message.role === "USER" ? "user" : "assistant",
  };
}

// Convert a UI Message to one or more Prisma Message
export function fromClientMessage(
  message: ClientMessage,
): Omit<Message, "chatId" | "createdAt">[] {
  return message.parts
    .filter(({ type }) => type === "text" || type === "reasoning")
    .map((part, index) => ({
      content: part.type === "text" ? part.text : null,
      // NOTE: Each part must have unique ID. We can't always suffix with part
      // number, because that ends up with {message.id}.0.0.0 ... but it works
      // for parts 2 (index=1), 3 (index=2), etc.
      id: index ? `${message.id}.${index}` : message.id,
      isAborted: message.metadata?.isAborted ?? false,
      reasoning: part.type === "reasoning" ? part.text : null,
      role: message.role === "user" ? "USER" : "ASSISTANT",
    }));
}

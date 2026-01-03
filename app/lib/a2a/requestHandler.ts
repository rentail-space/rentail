import type { Message } from "@a2a-js/sdk";
import {
  type AgentExecutor,
  DefaultRequestHandler,
  type ExecutionEventBus,
  InMemoryTaskStore,
  type RequestContext,
} from "@a2a-js/sdk/server";
import { generateText } from "ai";
import { ulid } from "ulid";
import chatPrompt from "~/prompts/chatPrompt.md?raw";
import { conversational } from "../models";
import preparePrompt from "../preparePrompt";
import prisma from "../prisma";
import { createAnonymousUser, recentMessages } from "../sessions.server";
import rentailAgentCard from "./agentCard";

/**
 * @see https://agent2agent.info/docs/concepts/agentcard/
 * @see https://www.npmjs.com/package/@a2a-js/sdk
 */

class RentailExecutor implements AgentExecutor {
  async execute(
    requestContext: RequestContext,
    eventBus: ExecutionEventBus,
  ): Promise<void> {
    const response = await converse(requestContext);
    // Publish the message and signal that the interaction is finished.
    eventBus.publish(response);
    eventBus.finished();
  }

  // cancelTask is not needed for this simple, non-stateful agent.
  cancelTask = async (): Promise<void> => {};
}

async function converse(requestContext: RequestContext): Promise<Message> {
  const user = await createAnonymousUser({
    chatId: requestContext.contextId,
    requestHeaders: new Headers(),
  });
  const chatId = user.chats[0].id;
  await prisma.messages.create({
    data: {
      chatId,
      content: requestContext.userMessage.parts
        .filter((part) => part.kind === "text")
        .map((part) => ({ text: part.text, type: "text" })),
      id: requestContext.userMessage.messageId,
      role: "user",
      type: "text",
    },
  });
  const recent = await recentMessages(chatId);

  const { text } = await generateText({
    messages: recent.map((message) => ({
      content: message.parts
        .filter((part) => part.type === "text")
        .map((part) => ({ text: part.text, type: "text" })),
      id: message.id,
      role: message.role as "user" | "assistant",
    })),
    system: await preparePrompt({
      headers: new Headers(),
      prompt: chatPrompt,
      user,
    }),
    ...conversational,
  });

  const saved = await prisma.messages.create({
    data: {
      chatId,
      content: text,
      id: ulid(),
      role: "assistant",
      type: "text",
    },
  });

  const responseMessage: Message = {
    kind: "message",
    messageId: saved.id,
    role: "agent",
    parts: [{ kind: "text", text }],
    contextId: requestContext.contextId,
  };
  return responseMessage;
}

const agentExecutor = new RentailExecutor();
const requestHandler = new DefaultRequestHandler(
  rentailAgentCard,
  new InMemoryTaskStore(),
  agentExecutor,
);

export default requestHandler;

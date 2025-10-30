import { toAISdkFormat } from "@mastra/ai-sdk";
import type { MastraMessageV2 } from "@mastra/core";
import { captureException } from "@sentry/react-router";
import { createUIMessageStreamResponse, stepCountIs } from "ai";
import debug from "debug";
import { invariant, last } from "es-toolkit";
import humanFormat from "human-format";
import mastra from "~/lib/agent";
import findNearbyProperties from "~/lib/findNearbyProperties";
import { monitorStopSignal } from "~/lib/redis-stop-monitor";
import general from "~/prompts/general.md?raw";
import { findOrCreateUser } from "~/sessions.server";
import type { Route } from "./+types/api.chat.$id.message";

// @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence
// @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-resume-streams
const logger = debug("chat");

export async function action({ params, request }: Route.ActionArgs) {
  const { messages } = (await request.clone().json()) as {
    messages: MastraMessageV2[];
  };
  const lastMessage = last(messages);
  if (!lastMessage) return new Response("Message is required", { status: 400 });
  logger("User's last message: %o", lastMessage);

  const { chat, headers, user } = await findOrCreateUser({
    chatId: params.id,
    headers: request.headers,
  });

  // Set up Redis stop monitoring
  const { abortSignal } = await monitorStopSignal(chat.id);
  const { properties, markdown } = await findNearbyProperties({
    chat,
    maxDistance: 20,
    user,
  });
  logger("Found %d properties", properties.length);

  const agent = mastra.getAgentById("main");
  const memory = await agent.getMemory();
  invariant(memory, "Memory is required");

  // Load existing messages to see what will be sent
  const { messagesV2 } = await memory.rememberMessages({ threadId: chat.id });
  const stream = await agent.stream(messages, {
    abortSignal,
    memory: { resource: user.id, thread: chat.id },
    savePerStep: true,
    maxSteps: 3,
    stopWhen: stepCountIs(3),
    requireToolApproval: false,
    system: `${general}\n\n=====\n\n${markdown}`,

    onAbort: async () => {
      logger("Aborted by user");
    },

    onError: (error) => {
      console.error("Error in agent stream", {
        error,
        chat: chat.id,
        messagesCount: messagesV2.length,
      });
      captureException(error, {
        extra: { chat, messagesCount: messagesV2.length },
      });
    },

    onFinish: async ({ steps, usage }) => {
      logger(
        "Finished: %d steps => total tokens %s",
        steps.length,
        humanFormat(usage.totalTokens ?? 0),
      );
    },

    onChunk: (data) => {
      logger("Chunk: %o", data);
    },

    providerOptions: {
      anthropic: {
        sendReasoning: false,
        thinking: { type: "disabled" },
      },
    },

    modelSettings: {
      temperature: 0,
    },
  });

  // NOTE No await! This keeps Node alive if browser request is closed prematurely
  stream.consumeStream();

  return createUIMessageStreamResponse({
    headers,
    stream: toAISdkFormat(stream, { from: "agent" }),
  });
}

import type { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import type { MastraMessageV2 } from "@mastra/core";
import { captureException } from "@sentry/react-router";
import { stepCountIs, type UIMessage } from "ai";
import { invariant } from "es-toolkit";
import humanFormat from "human-format";
import { ulid } from "ulid";
import mastra from "~/lib/agent";
import findNearbySpaces from "~/lib/findNearbySpaces";
import { monitorStopSignal } from "~/lib/redis-stop-monitor";
import general from "~/prompts/general.md?raw";
import { getUserChat } from "~/sessions.server";
import type { Route } from "./+types/api.chat";

// @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence
// @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-resume-streams

invariant(general, "General prompt is required");

export async function action({ request }: Route.ActionArgs) {
  console.log("[API] Received chat request");
  const { chat, headers } = await getUserChat(request.headers);
  console.log("[API] Got chat:", chat.id, "user:", chat.user.id);

  const { userMessage } = (await request.json()) as { userMessage: UIMessage };
  console.log("[API] User message:", userMessage.parts[0]);

  // Set up Redis stop monitoring
  const { abortSignal, cleanup } = await monitorStopSignal(chat.id);
  const spaces = await findNearbySpaces({ chat, distance: 20 });

  const agent = mastra.getAgentById("main");
  const memory = await agent.getMemory();
  invariant(memory, "Memory is required");
  console.log("[API] Saving user message to database...");
  const messages = await memory.saveMessages({
    messages: [
      {
        id: ulid(),
        role: "user",
        createdAt: new Date(),
        threadId: chat.id,
        resourceId: chat.user.id,
        type: "text",
        content: {
          parts: userMessage.parts.map((part) => ({
            text: part.type === "text" ? part.text : "",
            type: "text",
          })),
          format: 2,
        },
      },
    ],
    format: "v2",
  });
  console.log("[API] Saved user message, total messages:", messages.length);

  const initialMessages: MastraMessageV2[] = messages.map((message) => ({
    content: message.content,
    createdAt: message.createdAt,
    id: message.id,
    role: message.role,
  }));

  const result = await agent.streamVNext(initialMessages, {
    abortSignal,
    format: "aisdk",
    memory: {
      resource: chat.user.id,
      thread: chat.id,
    },
    savePerStep: true,
    maxSteps: 3,
    stopWhen: stepCountIs(3),
    requireToolApproval: false,
    system: `${general}\n\n=====\n\n${spaces}`,

    onFinish: async ({ steps, usage }) => {
      console.info(
        "[CHAT] steps %d => total tokens %s",
        steps.length,
        humanFormat(usage.totalTokens ?? 0),
      );
      await cleanup();
    },

    onAbort: async () => {
      console.info("[CHAT] Aborted by user");
      await cleanup();
    },

    providerOptions: {
      anthropic: {
        sendReasoning: false,
        thinking: { type: "disabled", budgetTokens: 12000 },
      } satisfies AnthropicProviderOptions,
    },
  });

  // Consume the stream to ensure it runs to completion & triggers onFinish even
  // when the client response is aborted:
  result.consumeStream(); // no await

  // Stream the response to the client,  saving the last message(s) from the
  // assistant.
  return result.toUIMessageStreamResponse({
    /*
    async consumeSseStream({ stream }) {
      const activeStreamId = ulid();
      // Create a resumable stream from the SSE stream
      const streamContext = createResumableStreamContext({
        // NOTE: use separate instances for publisher and subscriber
        publisher: new Redis(env.REDIS_URL),
        subscriber: new Redis(env.REDIS_URL),
        waitUntil: null,
      });
      await streamContext.createNewResumableStream(
        activeStreamId,
        () => stream,
      );
      await updateChat({ chat, activeStreamId });
    },
    */

    generateMessageId: ulid,

    onError: (error) => {
      captureException(error, { extra: { chat } });
      return JSON.stringify(error);
    },

    onFinish: async ({ messages, isAborted }) => {
      console.info(
        "[CHAT] Finished: messages=%d isAborted=%s",
        messages.length,
        isAborted,
      );
    },

    sendReasoning: false,
    headers,
  });
}

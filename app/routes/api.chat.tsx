import type { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import type { MastraMessageV2 } from "@mastra/core";
import { captureException } from "@sentry/react-router";
import { stepCountIs, type UIMessage } from "ai";
import debug from "debug";
import { invariant } from "es-toolkit";
import humanFormat from "human-format";
import type { PropertySpace } from "prisma/generated/client";
import type { PropertyGetPayload } from "prisma/generated/models";
import { ulid } from "ulid";
import mastra from "~/lib/agent";
import findNearbyProperties from "~/lib/findNearbyProperties";
import { monitorStopSignal } from "~/lib/redis-stop-monitor";
import general from "~/prompts/general.md?raw";
import { getUserChat } from "~/sessions.server";
import type { Route } from "./+types/api.chat";

// @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence
// @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-resume-streams

export async function action({ request }: Route.ActionArgs) {
  const { chat, headers } = await getUserChat(request.headers);
  const { userMessage } = (await request.json()) as { userMessage: UIMessage };

  // Set up Redis stop monitoring
  const { abortSignal, cleanup } = await monitorStopSignal(chat.id);
  const properties = await findNearbyProperties({ chat, maxDistance: 20 });

  const agent = mastra.getAgentById("main");
  const memory = await agent.getMemory();
  invariant(memory, "Memory is required");
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

  const initialMessages: MastraMessageV2[] = messages.map((message) => ({
    content: message.content,
    createdAt: message.createdAt,
    id: message.id,
    role: message.role,
  }));

  const result = await agent.stream(initialMessages, {
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
    system: `${general}\n\n=====\n\n${propertiesToMarkdown({ properties, maxDistance: 20 })}`,

    onFinish: async ({ steps, usage }) => {
      debug("chat")(
        "steps %d => total tokens %s",
        steps.length,
        humanFormat(usage.totalTokens ?? 0),
      );
      await cleanup();
    },

    onAbort: async () => {
      debug("chat")("Aborted by user");
      await cleanup();
    },

    providerOptions: {
      anthropic: {
        sendReasoning: false,
        thinking: {
          type: "disabled",
          budgetTokens: 12000,
        },
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
      debug("chat")(
        "Finished: messages=%d isAborted=%s",
        messages.length,
        isAborted,
      );
    },

    sendReasoning: false,
    headers,
  });
}

function propertiesToMarkdown({
  properties,
  maxDistance,
}: {
  properties: PropertyGetPayload<{ include: { spaces: true } }>[];
  maxDistance: number;
}): string {
  if (properties.length === 0)
    return "I don't know where you are, so I can't find any shopping centers near you.";

  const prefix = `Here are the shopping centers in the area which are within ${maxDistance} miles of the user.
    These are all the shopping centers you know about.
    You do not know about any other shopping centers.
    If the user asks about a shopping center you do not know about, you should say so.
    Do not make up information about shopping centers you do not know about.
    Do not even mention shopping centers you do not know about.`;

  return `${prefix}\n\n${properties.map(propertyToMarkdown).join("\n\n")}`;
}

function propertyToMarkdown(
  property: PropertyGetPayload<{ include: { spaces: true } }>,
): string {
  return `<shopping-center>
  Shopping center name: ${property.name}
  Address: ${property.address}, ${property.city}, ${property.state}, ${property.country}
  Description: ${property.description}
  ${property.imageURLs.map((image) => `Image: ${image}`).join("\n")}
  Spaces: ${property.spaces.map(propertySpacesToMarkdown).join("\n")}
</shopping-center>`;
}

function propertySpacesToMarkdown(space: PropertySpace): string {
  return `<space>
  Space name: ${space.name}
  Description: ${space.details}
  Cost: ${space.cost}
  Foot traffic: ${space.footTraffic}
  Size: ${space.size} sqft
  Available: ${space.available}
  ${space.imageURLs.map((image) => `Image: ${image}`).join("\n")}
</space>`;
}

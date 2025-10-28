import type { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import { toAISdkFormat } from "@mastra/ai-sdk";
import type { MastraMessageV2 } from "@mastra/core";
import { captureException } from "@sentry/react-router";
import { createUIMessageStreamResponse, stepCountIs } from "ai";
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
  const { message, chatId } = (await request.json()) as {
    chatId: string;
    message: string;
  };
  invariant(chat.id === chatId, "Chat ID is incorrect");

  // Set up Redis stop monitoring
  const { abortSignal, cleanup } = await monitorStopSignal(chatId);
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
        threadId: chatId,
        resourceId: chat.user.id,
        type: "text",
        content: {
          format: 2,
          parts: [{ type: "text", text: message }],
        },
      },
    ],
    format: "v2",
  });

  const initialMessages: MastraMessageV2[] = messages;

  const stream = await agent.stream(initialMessages, {
    abortSignal,
    memory: {
      resource: chat.user.id,
      thread: chat.id,
    },
    savePerStep: true,
    maxSteps: 3,
    stopWhen: stepCountIs(3),
    requireToolApproval: false,
    system: `${general}\n\n=====\n\n${centersToMarkdown({ properties, maxDistance: 20 })}`,

    onAbort: async () => {
      debug("chat")("Aborted by user");
      await cleanup();
    },

    onError: (error) => {
      captureException(error, { extra: { chat } });
    },

    onFinish: async ({ steps, usage }) => {
      debug("chat")(
        "steps %d => total tokens %s",
        steps.length,
        humanFormat(usage.totalTokens ?? 0),
      );
      await cleanup();
    },

    providerOptions: {
      anthropic: {
        sendReasoning: true,
        thinking: {
          type: "enabled",
          budgetTokens: 12000,
        },
      } satisfies AnthropicProviderOptions,
    },
  });

  // Consume the stream to ensure it runs to completion & triggers onFinish even
  // when the client response is aborted:
  stream.consumeStream(); // no await

  // Return the UI message stream response
  return createUIMessageStreamResponse({
    headers,
    stream: toAISdkFormat(stream, { from: "agent" }),
  });
}

function centersToMarkdown({
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

  return `${prefix}\n\n${properties.map(centerToMarkdown).join("\n\n")}`;
}

function centerToMarkdown(
  property: PropertyGetPayload<{ include: { spaces: true } }>,
): string {
  return `<shopping-center>
  Shopping center name: ${property.name}
  Address: ${property.address}, ${property.city}, ${property.state}, ${property.country}
  Description: ${property.description}
  ${property.imageURLs.map((image) => `Image: ${image}`).join("\n")}
  Spaces: ${property.spaces.map(centerSpacesToMarkdown).join("\n")}
</shopping-center>`;
}

function centerSpacesToMarkdown(space: PropertySpace): string {
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

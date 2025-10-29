import type { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import { toAISdkFormat } from "@mastra/ai-sdk";
import { captureException } from "@sentry/react-router";
import { createUIMessageStreamResponse, stepCountIs } from "ai";
import debug from "debug";
import { invariant } from "es-toolkit";
import humanFormat from "human-format";
import type { PropertySpace } from "prisma/generated/client";
import type { PropertyGetPayload } from "prisma/generated/models";
import mastra from "~/lib/agent";
import findNearbyProperties from "~/lib/findNearbyProperties";
import { monitorStopSignal } from "~/lib/redis-stop-monitor";
import general from "~/prompts/general.md?raw";
import { createUser } from "~/sessions.server";
import type { Route } from "./+types/api.chat.$id.message";

// @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence
// @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-resume-streams

export async function action({ params, request }: Route.ActionArgs) {
  const { message } = (await request.json()) as { message: string };

  const { chat, headers } = await createUser({
    chatId: params.id,
    headers: request.headers,
  });

  // Set up Redis stop monitoring
  const { abortSignal, cleanup } = await monitorStopSignal(chat.id);
  const properties = await findNearbyProperties({ chat, maxDistance: 20 });

  const agent = mastra.getAgentById("main");
  const memory = await agent.getMemory();
  invariant(memory, "Memory is required");

  // Load existing messages to see what will be sent
  const { messagesV2 } = await memory.rememberMessages({ threadId: chat.id });
  debug("chat")(
    "Loaded %d messages from memory for thread %s",
    messagesV2.length,
    chat.id,
  );

  // Log message content for debugging
  messagesV2.forEach((msg, i) => {
    const partsCount = msg.content?.parts?.length || 0;
    debug("chat")("  Message %d: %s, parts: %d", i, msg.role, partsCount);
    if (partsCount === 0) {
      console.error(`❌ Message ${i} (${msg.id}) has NO PARTS!`, msg);
    }
  });

  debug("chat")("Streaming new message: '%s'", message);

  const stream = await agent.stream(message, {
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
          type: "disabled",
          budgetTokens: 12000,
        },
      } satisfies AnthropicProviderOptions,
    },
  });

  stream.consumeStream(); // no await

  // Return the UI message stream response
  // The stream will be consumed by the client
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

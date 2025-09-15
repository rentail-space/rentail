import { UI_MESSAGE_STREAM_HEADERS } from "ai";
import Redis from "ioredis";
import { createResumableStreamContext } from "resumable-stream/ioredis";
import env from "~/lib/env";
import prisma from "~/lib/prisma";
import type { Route } from "./+types/api.chat.$id.stream";

// @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-resume-streams

export async function loader({ params }: Route.LoaderArgs) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
  });
  if (!conversation) throw new Response(null, { status: 404 });

  // no content response when there is no active stream
  if (conversation.activeStreamId == null)
    return new Response(null, { status: 204 });

  const streamContext = createResumableStreamContext({
    waitUntil: null,
    publisher: new Redis(env.REDIS_URL),
    subscriber: new Redis(env.REDIS_URL),
  });
  return new Response(
    await streamContext.resumeExistingStream(conversation.activeStreamId),
    { headers: UI_MESSAGE_STREAM_HEADERS },
  );
}

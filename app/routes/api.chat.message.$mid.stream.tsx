import { UI_MESSAGE_STREAM_HEADERS } from "ai";
import { Redis } from "ioredis";
import { createResumableStreamContext } from "resumable-stream";
import env from "~/lib/env";
import { findOrCreateUser } from "~/sessions.server";
import type { Route } from "./+types/api.chat.message.$mid.stream";

/**
 * Resume a message stream.
 *
 * @param params.id - The ID of the chat.
 * @param params.mid - The ID of the message to resume.
 * @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-resume-streams
 */
export async function loader({ request }: Route.LoaderArgs) {
  const { chat } = await findOrCreateUser(request);
  if (!chat || chat.activeStreamId == null)
    return new Response(null, { status: 204 });

  const streamContext = createResumableStreamContext({
    waitUntil: async (promise) => await promise,
    subscriber: new Redis(env.REDIS_URL),
    publisher: new Redis(env.REDIS_URL),
  });

  return new Response(
    await streamContext.resumeExistingStream(chat.activeStreamId),
    { headers: UI_MESSAGE_STREAM_HEADERS },
  );
}

import { captureException } from "@sentry/react-router";
import Redis from "ioredis";
import env from "~/lib/env";

/**
 * Creates a Redis-based stop signal monitor for a chat.
 *
 * @param chatId - The ID of the chat to monitor.
 * @return abortSignal - Abort signal received from another server instance.
 * @return cleanup - Cleanup function to stop monitoring and remove the stop signal.
 */
export async function monitorStopSignal(chatId: string): Promise<{
  abortSignal: AbortSignal;
  cleanup: () => Promise<void>;
}> {
  const subscriber = new Redis(env.REDIS_URL);
  const key = `chat:stop:${chatId}`;
  const abort = new AbortController();
  abort.signal.addEventListener("abort", () => {
    console.info("[CHAT] Stop signal received, aborting %s", chatId);
  });

  // Subscribe to abort signal from another server instance
  await subscriber.subscribe(key);
  subscriber.once("message", (channel, message) => {
    if (channel === key && message === "stop") abort.abort();
  });

  // Abort the signal returned to the caller
  try {
    const redis = new Redis(env.REDIS_URL);
    if ((await redis.get(key)) === "stop") abort.abort();
    await redis.quit();
  } catch (error) {
    captureException(error, { extra: { chatId } });
  }

  async function cleanup() {
    try {
      if (subscriber.status !== "end") {
        await subscriber.unsubscribe(key);
        subscriber.disconnect();
      }

      const redis = new Redis(env.REDIS_URL);
      await redis.del(key);
      redis.disconnect();
    } catch (error) {
      captureException(error, { extra: { chatId } });
    }
  }

  return { abortSignal: abort.signal, cleanup };
}

/**
 * Sends an abort signal to another server instance.
 *
 * @param chatId - The ID of the chat to stop.
 */
export async function stopChat(chatId: string) {
  const redis = new Redis(env.REDIS_URL);
  const key = `chat:stop:${chatId}`;
  try {
    // Set a stop signal that expires after 30 seconds
    await redis.set(key, "stop", "EX", 30);

    // Also publish to a channel for immediate notification
    await redis.publish(key, "stop");
  } catch (error) {
    captureException(error, { extra: { chatId } });
  } finally {
    await redis.quit();
  }
}

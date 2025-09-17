import { captureException } from "@sentry/react";
import Redis from "ioredis";
import env from "~/lib/env";

/**
 * Creates a Redis-based stop signal monitor for a conversation.
 *
 * @param conversationId - The ID of the conversation to monitor.
 * @return abortSignal - Abort signal received from another server instance.
 * @return cleanup - Cleanup function to stop monitoring and remove the stop signal.
 */
export function monitorStopSignal(conversationId: string): {
  abortSignal: AbortSignal;
  cleanup: () => Promise<void>;
} {
  const subscriber = new Redis(env.REDIS_URL);
  const key = `chat:stop:${conversationId}`;
  const abort = new AbortController();
  abort.signal.addEventListener("abort", () => {
    console.info("[CHAT] Stop signal received, aborting %s", conversationId);
  });

  // Subscribe to abort signal from another server instance
  subscriber.subscribe(key);
  subscriber.once("message", (channel, message) => {
    if (channel === key && message === "stop") abort.abort();
  });

  // Abort the signal returned to the caller
  setTimeout(async () => {
    try {
      const redis = new Redis(env.REDIS_URL);
      if (await redis.get(key)) abort.abort();
      await redis.quit();
    } catch (error) {
      captureException(error);
    }
  }, 10);

  async function cleanup() {
    try {
      if (subscriber.status !== "end") {
        subscriber.unsubscribe(key);
        subscriber.quit();
      }

      const redis = new Redis(env.REDIS_URL);
      await redis.del(key);
      await redis.quit();
    } catch (error) {
      captureException(error);
    }
  }

  return { abortSignal: abort.signal, cleanup };
}

/**
 * Sends an abort signal to another server instance.
 *
 * @param conversationId - The ID of the conversation to stop.
 */
export async function stopChat(conversationId: string) {
  const redis = new Redis(env.REDIS_URL);
  const key = `chat:stop:${conversationId}`;
  try {
    // Set a stop signal that expires after 30 seconds
    await redis.setex(key, 30, "1");

    // Also publish to a channel for immediate notification
    await redis.publish(key, "stop");
  } catch (error) {
    captureException(error);
  } finally {
    await redis.quit();
  }
}

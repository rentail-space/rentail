import { captureException } from "@sentry/react";
import Redis from "ioredis";
import env from "~/lib/env";

/**
 * Creates a Redis-based stop signal monitor for a conversation
 */
export function createStopMonitor(conversationId: string, onStop: () => void) {
  const subscriber = new Redis(env.REDIS_URL);
  const stopKey = `chat:stop:${conversationId}`;
  const channelKey = `chat:stop:${conversationId}`;

  // Subscribe to immediate stop notifications
  subscriber.subscribe(channelKey);
  subscriber.on("message", (channel, message) => {
    if (channel === channelKey && message === "stop") onStop();
  });

  return async () => {
    try {
      // Check if subscriber is already closed to avoid errors
      if (subscriber.status !== "end") {
        await subscriber.unsubscribe(channelKey);
        await subscriber.quit();
      }

      // Clear the stop signal
      const cleanup = new Redis(env.REDIS_URL);
      await cleanup.del(stopKey);
      await cleanup.quit();
    } catch (error) {
      console.error("Error during stop monitor cleanup:", error);
    }
  };
}

export async function triggerStop(conversationId: string) {
  const redis = new Redis(env.REDIS_URL);
  try {
    // Set a stop signal that expires after 30 seconds
    const stopKey = `chat:stop:${conversationId}`;
    await redis.setex(stopKey, 30, "1");

    // Also publish to a channel for immediate notification
    await redis.publish(`chat:stop:${conversationId}`, "stop");

    return true;
  } catch (error) {
    captureException(error);
  } finally {
    await redis.quit();
  }
}

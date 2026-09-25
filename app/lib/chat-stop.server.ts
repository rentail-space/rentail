import { ms } from "convert";
import { sleep } from "radashi";
import { z } from "zod";
import prisma from "~/lib/prisma.server";
import debug from "debug";

const logger = debug("server:chat");

/**
 * Postgres-backed stop signals for running chat streams.
 *
 * Replaces the previous Redis pub/sub implementation. The stream request
 * polls the `cache` table while the stream is active; a stop request from
 * any server instance writes a row that the poller picks up.
 */

const STOP_KEY_TTL = ms("1m");
const POLL_INTERVAL = ms("1s");
// Bound the poller: streams never legitimately run this long.
const MAX_MONITOR_DURATION = ms("10m");

const stopKey = (chatId: string) => `chat-stop:${chatId}`;

const stopValueSchema = z.object({
  requestedAt: z.string(),
});

/**
 * Watch for a stop signal for the given chat while its stream runs.
 *
 * The monitor stops itself once the stream finishes (active stream ID
 * cleared), after the hard cap, or as soon as a stop signal arrives.
 */
export async function monitorStopSignal(chatId: string): Promise<{
  abortSignal: AbortSignal;
}> {
  const abort = new AbortController();
  const startedAt = Date.now();

  void (async () => {
    while (!abort.signal.aborted) {
      if (Date.now() - startedAt > MAX_MONITOR_DURATION) {
        logger("Stop monitor for %s timed out", chatId);
        return;
      }

      try {
        const [signal, chat] = await Promise.all([
          prisma.cache.findUnique({ where: { key: stopKey(chatId) } }),
          prisma.chat.findUnique({
            where: { id: chatId },
            select: { activeStreamId: true },
          }),
        ]);

        // Only honor signals requested for this stream run; ignore rows left
        // over from a previous message.
        const requestedAt = Date.parse(
          stopValueSchema.safeParse(signal?.value).data?.requestedAt ?? "",
        );
        if (requestedAt > startedAt - ms("5s")) {
          logger("Stop signal received, aborting %s", chatId);
          abort.abort();
          return;
        }

        // Stream finished (or chat gone) — nothing left to monitor.
        if (!chat?.activeStreamId) return;
      } catch (error) {
        console.error("Error polling stop signal for %s: %s", chatId, error);
      }

      await sleep(POLL_INTERVAL);
    }

    // Clean up the signal row so a later message isn't stopped by a stale one.
    await prisma.cache
      .deleteMany({ where: { key: stopKey(chatId) } })
      .catch(() => {});
  })();

  return { abortSignal: abort.signal };
}

/**
 * Send a stop signal to the server instance streaming the chat.
 */
export async function stopChat(chatId: string) {
  try {
    await prisma.cache.upsert({
      where: { key: stopKey(chatId) },
      create: {
        key: stopKey(chatId),
        value: { requestedAt: new Date().toISOString() },
      },
      update: { value: { requestedAt: new Date().toISOString() } },
    });
    // The poller ignores stale rows; drop the signal if nobody claims it.
    void sleep(STOP_KEY_TTL).then(() =>
      prisma.cache.deleteMany({ where: { key: stopKey(chatId) } }),
    );
  } catch (error) {
    console.error("Error sending stop signal for %s: %s", chatId, error);
  }
}

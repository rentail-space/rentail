import { ms } from "convert";
import { sleep } from "radashi";
import { z } from "zod";
import prisma from "~/lib/prisma.server";

/**
 * Postgres-backed resumable chat streams.
 *
 * Replaces the previous Redis implementation (resumable-stream + ioredis).
 * The raw UI message stream (SSE) is buffered into the `cache` table as it is
 * consumed; a reconnecting client replays the buffer and tails it by polling
 * until the stream is marked done.
 *
 * Keys are swept one hour after creation whenever a new stream starts, so a
 * crashed stream cannot leak rows.
 */

const STREAM_TTL = ms("1h");
const WRITE_INTERVAL = ms("200ms");
const POLL_INTERVAL = ms("300ms");
// Hard cap so a stream killed before `done` was written cannot hang a reader.
const MAX_RESUME_DURATION = ms("10m");

const streamValueSchema = z.object({
  content: z.string(),
  done: z.boolean(),
});

const streamKey = (streamId: string) => `chat-stream:${streamId}`;

/**
 * Buffer an SSE stream in Postgres so it can be replayed after a reconnect.
 *
 * Resolves when the stream is fully consumed and marked done.
 */
export async function bufferChatStream(
  streamId: string,
  stream: ReadableStream<string>,
): Promise<void> {
  const key = streamKey(streamId);
  let content = "";

  const write = async (done: boolean) => {
    await prisma.cache.upsert({
      where: { key },
      create: { key, value: { content, done } },
      update: { value: { content, done } },
    });
  };

  await write(false);

  // Sweep expired streams from crashed runs.
  await prisma.cache.deleteMany({
    where: {
      key: { startsWith: "chat-stream:" },
      createdAt: { lt: new Date(Date.now() - STREAM_TTL) },
    },
  });

  const reader = stream.getReader();
  let lastWrite = Date.now();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      content += value;
      if (Date.now() - lastWrite >= WRITE_INTERVAL) {
        await write(false);
        lastWrite = Date.now();
      }
    }
  } finally {
    // Mark done even on error so readers stop polling.
    await write(true);
    reader.releaseLock();
  }
}

/**
 * Replay a buffered stream from the beginning, tailing it until done.
 *
 * Returns null when there is no buffer for the stream (already consumed,
 * expired, or never created) — the caller signals stream completion.
 */
export function resumeChatStream(
  streamId: string,
): Promise<ReadableStream<Uint8Array> | null> {
  const startedAt = Date.now();
  let offset = 0;

  return (async () => {
    const existing = await prisma.cache.findUnique({
      where: { key: streamKey(streamId) },
    });
    if (!existing || !streamValueSchema.safeParse(existing.value).success)
      return null;

    const encoder = new TextEncoder();
    let cancelled = false;

    return new ReadableStream<Uint8Array>({
      // Push-based polling: the loop below enqueues new data as it appears.
      // A pull-based implementation deadlocks here — pull is only re-invoked
      // by a new read request or an enqueue, and a consumer that awaits a
      // single read (e.g. the response pump) can never issue the next one
      // once a pull returns without data.
      start(controller) {
        void (async () => {
          try {
            while (!cancelled) {
              const row = await prisma.cache.findUnique({
                where: { key: streamKey(streamId) },
              });
              const parsed = streamValueSchema.safeParse(row?.value);

              // Buffer deleted or unreadable — treat as complete.
              if (!parsed.success) break;

              const { content, done } = parsed.data;
              if (content.length > offset) {
                controller.enqueue(encoder.encode(content.slice(offset)));
                offset = content.length;
              }

              if (done || Date.now() - startedAt > MAX_RESUME_DURATION) break;

              await sleep(POLL_INTERVAL);
            }
          } catch {
            // Consumer disconnected or DB error — fall through to close.
          } finally {
            try {
              controller.close();
            } catch {
              // Already closed or cancelled.
            }
          }
        })();
      },
      cancel() {
        cancelled = true;
      },
    });
  })();
}

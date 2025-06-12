import { createAnthropic } from "@ai-sdk/anthropic";
import { type Message, streamText } from "ai";
import env from "env-var";
import invariant from "tiny-invariant";
import system from "../lib/system.md?raw";
import type { Route } from "./+types/api.chat";

const anthropic = createAnthropic({
  apiKey: env.get("ANTHROPIC_API_KEY").required().asString(),
});

invariant(system, "System prompt is required");

export async function action({ request }: Route.ActionArgs) {
  const { messages } = (await request.json()) as { messages: Message[] };
  const result = streamText({
    model: anthropic("claude-3-7-sonnet-20250219"),
    system: "You are a helpful assistant.",
    messages: [{ role: "system", content: system }, ...messages],
  });
  return result.toDataStreamResponse();
}

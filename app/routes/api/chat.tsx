import { createAnthropic } from "@ai-sdk/anthropic";
import { type Message, streamText } from "ai";
import env from "env-var";
import type { ActionFunctionArgs } from "react-router";
import system from "./system.md?raw";

const anthropic = createAnthropic({
  apiKey: env.get("ANTHROPIC_API_KEY").required().asString(),
});

export async function action({ request }: ActionFunctionArgs) {
  const { messages } = (await request.json()) as { messages: Message[] };
  const result = streamText({
    model: anthropic("claude-3-7-sonnet-20250219"),
    system: "You are a helpful assistant.",
    messages: [{ role: "system", content: system }, ...messages],
  });
  return result.toDataStreamResponse();
}

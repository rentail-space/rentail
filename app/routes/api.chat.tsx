import { type Message, streamText } from "ai";
import invariant from "tiny-invariant";
import model from "~/lib/llm";
import system from "../lib/system.md?raw";
import type { Route } from "./+types/api.chat";

invariant(system, "System prompt is required");

export async function action({ request }: Route.ActionArgs) {
  const { messages } = (await request.json()) as { messages: Message[] };
  const result = streamText({ messages, model, system });
  return result.toDataStreamResponse();
}

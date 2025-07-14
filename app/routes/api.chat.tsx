import { type Message, streamText } from "ai";
import invariant from "tiny-invariant";
import model from "~/lib/llm";
import general from "../lib/general.md?raw";
import spaces from "../lib/spaces.md?raw";
import type { Route } from "./+types/api.chat";

invariant(general, "General prompt is required");
invariant(spaces, "Centers list is required");

export async function action({ request }: Route.ActionArgs) {
  const { messages } = (await request.json()) as { messages: Message[] };
  const result = streamText({
    messages,
    model,
    system: [general, spaces].join("\n\n=====\n\n"),
  });
  return result.toDataStreamResponse();
}

import { type Message, streamText } from "ai";
import invariant from "tiny-invariant";
import model from "~/lib/llm";
import centers from "../lib/centers.md?raw";
import general from "../lib/general.md?raw";
import type { Route } from "./+types/api.chat";

invariant(general, "General prompt is required");
invariant(centers, "Centers prompt is required");

export async function action({ request }: Route.ActionArgs) {
  const { messages } = (await request.json()) as { messages: Message[] };
  const result = streamText({
    messages,
    model,
    system: [general, centers].join("\n\n=====\n\n"),
  });
  return result.toDataStreamResponse();
}

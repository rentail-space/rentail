import { convertToModelMessages, streamText, type UIMessage } from "ai";
import invariant from "tiny-invariant";
import general from "../lib/general.md?raw";
import spaces from "../lib/spaces.md?raw";
import type { Route } from "./+types/api.chat";

invariant(general, "General prompt is required");
invariant(spaces, "Centers list is required");

export async function action({ request }: Route.ActionArgs) {
  const { messages }: { messages: UIMessage[] } = await request.json();
  const result = streamText({
    messages: convertToModelMessages(messages),
    model: "anthropic/claude-sonnet-4",
    providerOptions: {
      anthropic: {
        thinking: {
          budgetTokens: 12000,
          type: "disabled",
        },
      },
    },
    system: [general, spaces].join("\n\n=====\n\n"),
  });
  return result.toUIMessageStreamResponse();
}

/**
 * {
 *   "id":"Nv2i6Na7LGdM4QLx",
 *   "messages":[
 *     {
 *       "parts":[{"text":"Welcome to **rentail.space**!\n\nI'm your virtual assistant here to help you find the perfect retail space for\nyour business needs.  How can I assist you today?"}],
 *       "role":"assistant"
 *     },
 *     {
 *       "parts":[{"text":"What are the available retail spaces?"}],
 *       "role":
 *       "user","id":"RNf0kp5K0xhgmH3O"
 *     }
 *   ],
 *   "trigger":"submit-message"
 * }
 */

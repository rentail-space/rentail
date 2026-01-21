/**
 * OpenAI client for querying ChatGPT with search capability.
 *
 * Note: ChatGPT's web search is powered by their API. We need to use
 * the proper model with search capabilities enabled.
 */

import { createOpenAI } from "@ai-sdk/openai";
import env from "~/lib/env";

/**
 * This uses OpenAI's API to simulate how users would query ChatGPT with web
 * search enabled.
 *
 * @param query - The query to search for.
 * @returns The response from ChatGPT
 */
export default async function queryChatGPTWithSearch(query: string): Promise<{
  query: string;
  model: string;
  response: string;
}> {
  const model = "gpt-5-mini";
  const provider = createOpenAI({ apiKey: env.OPENAI_API_KEY }).responses(
    model,
  );
  const { content } = await provider.doGenerate({
    prompt: [
      {
        role: "system",
        content:
          "You are ChatGPT with web search capabilities. When answering questions, search the web for current information and cite your sources using numbered citations like 【1】, 【2】, etc. Always include a 'Sources:' section at the end with numbered references.",
      },
      {
        role: "user",
        content: [{ text: query, type: "text" }],
      },
    ],
    maxOutputTokens: 2000,
  });
  const response = content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n");
  return { model, query, response };
}

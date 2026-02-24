import { openai } from "@ai-sdk/openai";
import type { LanguageModelV3, LanguageModelV3Source } from "@ai-sdk/provider";
import { generateText } from "ai";

export type ChatGPTResult = {
  sources: LanguageModelV3Source[];
  text: string;
};

export default async function queryChatGPTWithSearch({
  model,
  query,
}: {
  model: LanguageModelV3;
  query: string;
}): Promise<ChatGPTResult> {
  const { sources, text } = await generateText({
    maxOutputTokens: 2000,
    model,
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
    tools: {
      web_search: openai.tools.webSearch({
        externalWebAccess: true,
        searchContextSize: "high",
        userLocation: {
          type: "approximate",
          city: "Los Angeles",
          region: "California",
        },
      }),
    },
    toolChoice: { type: "tool", toolName: "web_search" },
  });
  return { sources, text };
}

// app/lib/llm-visibility/geminiClient.ts

import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { map } from "radashi";
import invariant from "tiny-invariant";
import envVars from "~/lib/env";

const MODEL_ID = "gemini-2.5-flash";

export default async function queryGemini(query: string): Promise<{
  citations: string[];
  queries: string[];
}> {
  invariant(
    envVars.GOOGLE_GENERATIVE_AI_API_KEY,
    "GOOGLE_GENERATIVE_AI_API_KEY is not set",
  );

  const { providerMetadata } = await generateText({
    model: google(MODEL_ID),
    prompt: [
      {
        role: "system",
        content:
          "You are Gemini with web search capabilities. When answering questions, search the web for current information and cite your sources using numbered citations like 【1】, 【2】, etc. Always include a 'Sources:' section at the end with numbered references.",
      },
      {
        role: "user",
        content: [{ text: query, type: "text" }],
      },
    ],
    maxOutputTokens: 2000,
    tools: {
      web_search: google.tools.googleSearch({
        mode: "MODE_DYNAMIC",
        dynamicThreshold: 0.5,
      }),
    },
    toolChoice: { type: "tool", toolName: "web_search" },
  });

  const metadata = providerMetadata?.google.groundingMetadata as {
    webSearchQueries?: string[];
    groundingChunks?: {
      web: {
        uri: string;
      };
    }[];
  };

  const queries = metadata?.webSearchQueries;
  const urls = metadata?.groundingChunks?.map((chunk) => chunk.web.uri);
  const citations = await map(urls ?? [], async (url) => {
    const response = await fetch(url, { redirect: "follow" });
    return response.url;
  });

  return { queries: queries ?? [], citations: citations ?? [] };
}

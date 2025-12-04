import type {
  LanguageModelV2,
  LanguageModelV2CallOptions,
  LanguageModelV2Content,
  LanguageModelV2FinishReason,
  LanguageModelV2Middleware,
  LanguageModelV2Prompt,
} from "@ai-sdk/provider";
import crypto from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

type Cached = {
  request: {
    frequencyPenalty?: number;
    maxOutputTokens?: number;
    presencePenalty?: number;
    prompt: LanguageModelV2Prompt;
    seed?: number;
    stopSequences?: string[];
    temperature?: number;
    topK?: number;
    topP?: number;
  };
  response: {
    content: LanguageModelV2Content[];
    finishReason: LanguageModelV2FinishReason;
  };
};

const cacheLLMMiddleware: LanguageModelV2Middleware = {
  wrapGenerate: async ({
    doGenerate,
    params,
  }: {
    doGenerate: () => ReturnType<LanguageModelV2["doGenerate"]>;
    params: LanguageModelV2CallOptions;
  }) => {
    const request: Cached["request"] = {
      frequencyPenalty: params.frequencyPenalty,
      maxOutputTokens: params.maxOutputTokens,
      presencePenalty: params.presencePenalty,
      prompt: params.prompt.filter((part) => part.role === "user"),
      seed: params.seed,
      stopSequences: params.stopSequences,
      temperature: params.temperature,
      topK: params.topK,
      topP: params.topP,
    };
    const md5key = crypto
      .createHash("md5")
      .update(JSON.stringify(request))
      .digest("hex");
    const filename = resolve("test/cache", md5key);
    try {
      const cached = await readFile(filename, "utf-8");
      const { response } = JSON.parse(cached) as Cached;
      return {
        content: response.content,
        finishReason: response.finishReason,
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
        },
        warnings: [],
      } satisfies Awaited<ReturnType<LanguageModelV2["doGenerate"]>>;
    } catch {
      const result = await doGenerate();
      const response: Cached["response"] = {
        content: result.content,
        finishReason: result.finishReason,
      };
      await writeFile(
        filename,
        JSON.stringify({ request, response }, null, 2),
        "utf-8",
      );
      return result;
    }
  },
};

export default cacheLLMMiddleware;

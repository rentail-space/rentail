import { createAnthropic } from "@ai-sdk/anthropic";
import "dotenv/config";
import env from "env-var";
import https from "node:https";
import { createOllama } from "ollama-ai-provider";

let model = createAnthropic({
  apiKey: env.get("ANTHROPIC_API_KEY").required().asString(),
})("claude-4-opus-20250514");

https
  .get(
    "https://google.com",
    { signal: AbortSignal.timeout(1000) },
    (response) => {
      console.info("LLM model: %s", model.modelId);
      response.destroy();
    },
  )
  .on("error", (error) => {
    console.log(error);
    model = createOllama({})("deepseek-v2:latest");
    console.error("LLM model: %s", model.modelId);
  });

export default model;

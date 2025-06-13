import { createAnthropic } from "@ai-sdk/anthropic";
import env from "env-var";
import https from "node:https";
import { createOllama } from "ollama-ai-provider";

let model = createAnthropic({
  apiKey: env.get("ANTHROPIC_API_KEY").required().asString(),
})("claude-4-opus-20250514");
try {
  await new Promise((resolve, reject) =>
    https
      .get("https://google.com", { signal: AbortSignal.timeout(1000) }, resolve)
      .on("error", (error) => reject(error)),
  );
} catch (error) {
  model = createOllama({})("deepseek-v2:latest");
}
console.info("LLM model: %s", model.modelId);

export default model;

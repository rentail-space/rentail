import { createAnthropic } from "@ai-sdk/anthropic";
import serverConfig from "./config";

const apiKey = serverConfig.ANTHROPIC_API_KEY;
const model = "claude-4-opus-20250514";
const anthropic = createAnthropic({ apiKey })(model);
console.info("LLM model: %s", anthropic.modelId);

export default anthropic;

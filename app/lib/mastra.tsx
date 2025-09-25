import { createAnthropic } from "@ai-sdk/anthropic";
import { Agent } from "@mastra/core/agent";
import { ConsoleLogger } from "@mastra/core/logger";
import { Mastra } from "@mastra/core/mastra";
import { Memory } from "@mastra/memory";
import { PostgresStore } from "@mastra/pg";
import { ulid } from "ulid";
import zod from "zod";
import env from "~/lib/env";

// Store state in our Postgres database
const store = new PostgresStore({
  connectionString: env.DATABASE_URL,
});

const userProfile = zod.object({
  name: zod.string().describe("The user's name"),
  location: zod
    .object({ latitude: zod.string(), longitude: zod.string() })
    .describe("The user's location"),
  timezone: zod.string().describe("The user's timezone"),
  preferences: zod.object({
    communicationStyle: zod
      .string()
      .describe("The user's communication style e.g. Formal, Casual"),
    projectGoal: zod.string().describe("The user's project goal"),
    keyDeadlines: zod.array(zod.string()).describe("The user's key deadlines"),
  }),
  sessionState: zod.object({
    lastTaskDiscussed: zod.string().describe("The user's last task discussed"),
    openQuestions: zod
      .array(zod.string())
      .describe("The user's open questions"),
  }),
});

const memory = new Memory({
  options: {
    lastMessages: 100,
    threads: {
      generateTitle: true,
    },
    workingMemory: {
      enabled: true,
      schema: userProfile,
      scope: "resource",
    },
  },
  storage: store,
});

const agent = new Agent({
  id: "main",
  instructions: `
      You are a helpful weather assistant that provides accurate weather information.
 
      Your primary function is to help users get weather details for specific locations. When responding:
      - Always ask for a location if none is provided
      - If the location name isn’t in English, please translate it
      - If giving a location with multiple parts (e.g. "New York, NY"), use the most relevant part (e.g. "New York")
      - Include relevant details like humidity, wind conditions, and precipitation
      - Keep responses concise but informative
 
      Use the weatherTool to fetch current weather data.
`,
  memory,
  // Send the chat to Anthropic LLM
  model: createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })(
    "claude-sonnet-4-20250514",
  ),
  name: "Main Agent",
});

export default new Mastra({
  agents: { agent },
  idGenerator: ulid,
  logger: new ConsoleLogger(),
});

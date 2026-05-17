import dotenv from "dotenv";
import env from "env-var";

dotenv.config({ quiet: true, override: true });

const envVars = {
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  isDevelopment: process.env.NODE_ENV === "development",

  SENTRY_DSN: env.get("SENTRY_DSN").required(false).asString(),

  LOGTAIL_ENDPOINT: env.get("LOGTAIL_ENDPOINT").required(false).asString(),
  LOGTAIL_TOKEN: env.get("LOGTAIL_TOKEN").required(false).asString(),
  PUSHGATEWAY_TOKEN: env.get("PUSHGATEWAY_TOKEN").required(false).asString(),
  PUSHGATEWAY_URL: env.get("PUSHGATEWAY_URL").required(false).asString(),

  ANTHROPIC_API_KEY: env.get("ANTHROPIC_API_KEY").required(false).asString(),
  OPENAI_API_KEY: env.get("OPENAI_API_KEY").required(false).asString(),
  DEEPSEEK_API_KEY: env.get("DEEPSEEK_API_KEY").required(false).asString(),
  PERPLEXITY_API_KEY: env.get("PERPLEXITY_API_KEY").required(false).asString(),
  GOOGLE_GENERATIVE_AI_API_KEY: env
    .get("GOOGLE_GENERATIVE_AI_API_KEY")
    .required(false)
    .asString(),
  SERPAPI_KEY: env.get("SERPAPI_KEY").required(false).asString(),

  SESSION_SECRET: env.get("SESSION_SECRET").default("secret").asString(),
  DATABASE_URL: env.get("DATABASE_URL").required().asUrlString(),
  MAPBOX_TOKEN: env.get("MAPBOX_TOKEN").required(false).asString(),
  RESEND_API_KEY: env.get("RESEND_API_KEY").required().asString(),

  GOOGLE_ANALYTICS_PRIVATE_KEY: env
    .get("GOOGLE_ANALYTICS_PRIVATE_KEY")
    .required(false)
    .asString(),

  GOOGLE_PLACES_API_KEY: env
    .get("GOOGLE_PLACES_API_KEY")
    .required(false)
    .asString(),

  REDIS_URL: env
    .get("REDIS_URL")
    .default("redis://localhost:6379")
    .asUrlString(),

  COOLIFY_TOKEN: env.get("COOLIFY_TOKEN").required(false).asString(),
  HETZNER_TOKEN: env.get("HETZNER_TOKEN").required(false).asString(),
};

if (process.env.NODE_ENV === "test") {
  const verifyLocalhost = (name: string, url: string) => {
    if (new URL(url).hostname !== "localhost")
      throw new Error(`${name} must point to localhost in test, got: ${url}`);
  };
  try {
    verifyLocalhost("DATABASE_URL", envVars.DATABASE_URL);
    if (envVars.REDIS_URL) verifyLocalhost("REDIS_URL", envVars.REDIS_URL);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

export default envVars;

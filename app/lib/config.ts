import { existsSync } from "node:fs";
import dotenv from "dotenv";
import env from "env-var";

// NOTE This is used in GitHub Actions to load test enviroment from .env file.
const path = ".env";
if (existsSync(path)) dotenv.config({ path });

export default {
  isProduction: env.get("NODE_ENV").asString() === "production",
  isDebug: env.get("DEBUG").asString() !== undefined,
  isTest: env.get("NODE_ENV").asString() === "test",

  AI_GATEWAY_API_KEY: env.get("AI_GATEWAY_API_KEY").required().asString(),
  LOGTAIL_TOKEN: env.get("LOGTAIL_TOKEN").required(false).asString(),
  LOGTAIL_ENDPOINT: env.get("LOGTAIL_ENDPOINT").required(false).asUrlString(),
  PUSHGATEWAY_URL: env.get("PUSHGATEWAY_URL").required(false).asUrlString(),
  PUSHGATEWAY_TOKEN: env.get("PUSHGATEWAY_TOKEN").required(false).asString(),

  DATABASE_URL: env.get("DATABASE_URL").required().asUrlString(),
  DIRECT_URL: env.get("DIRECT_URL").required().asUrlString(),

  SENTRY_DSN: env.get("SENTRY_DSN").required(false).asUrlString(),

  SESSION_SECRET: env.get("SESSION_SECRET").required().asString(),
  SESSION_MAX_AGE_SECONDS: env
    .get("SESSION_MAX_AGE_SECONDS")
    .default(60 * 60 * 24 * 30)
    .asInt(),

  // SSR request timeout in milliseconds
  SSR_REQUEST_TIMEOUT_MS: env
    .get("SSR_REQUEST_TIMEOUT_MS")
    .default(5000)
    .asInt(),

  // Metrics collection interval in milliseconds
  METRICS_COLLECTION_INTERVAL_MS: env
    .get("METRICS_COLLECTION_INTERVAL_MS")
    .default(30_0000)
    .asInt(),
};

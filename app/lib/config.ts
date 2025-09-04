import dotenv from "dotenv";
import env from "env-var";

dotenv.config();
const isTest = process.env.NODE_ENV === "test";

export default {
  isProduction: process.env.NODE_ENV === "production",
  isDebug: !!process.env.DEBUG,
  isTest: process.env.NODE_ENV === "test",
  isDevelopment: process.env.NODE_ENV === "development",

  ANTHROPIC_API_KEY: env.get("ANTHROPIC_API_KEY").required(true).asString(),
  LOGTAIL_TOKEN: env.get("LOGTAIL_TOKEN").required(false).asString(),
  LOGTAIL_ENDPOINT: env.get("LOGTAIL_ENDPOINT").required(false).asUrlString(),
  PUSHGATEWAY_URL: env.get("PUSHGATEWAY_URL").required(false).asUrlString(),
  PUSHGATEWAY_TOKEN: env.get("PUSHGATEWAY_TOKEN").required(false).asString(),

  DATABASE_URL: isTest
    ? // secretlint-disable-next-line
      "postgresql://postgres:postgres@localhost:5432/postgres"
    : env.get("DATABASE_URL").required().asUrlString(),

  SENTRY_DSN: env.get("SENTRY_DSN").required(false).asUrlString(),

  SESSION_SECRET: env.get("SESSION_SECRET").required(true).asString(),
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

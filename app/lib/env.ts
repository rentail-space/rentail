import dotenv from "dotenv";
import env from "env-var";

dotenv.config();
const isTest = process.env.NODE_ENV === "test";

export default {
  isProduction: process.env.NODE_ENV === "production",
  isDebug: !!process.env.DEBUG,
  isTest: process.env.NODE_ENV === "test",
  isDevelopment: process.env.NODE_ENV === "development",

  LOGTAIL_ENDPOINT: env.get("LOGTAIL_ENDPOINT").required(false).asUrlString(),
  LOGTAIL_TOKEN: env.get("LOGTAIL_TOKEN").required(false).asString(),
  PUSHGATEWAY_TOKEN: env.get("PUSHGATEWAY_TOKEN").required(false).asString(),
  PUSHGATEWAY_URL: env.get("PUSHGATEWAY_URL").required(false).asUrlString(),
  SENTRY_DSN: env.get("SENTRY_DSN").required(false).asUrlString(),
  IPGEOLOCATION_API_KEY: env
    .get("IPGEOLOCATION_API_KEY")
    .required(false)
    .asString(),

  ANTHROPIC_API_KEY: env.get("ANTHROPIC_API_KEY").required(true).asString(),
  DATABASE_URL: isTest
    ? // secretlint-disable-next-line
      "postgresql://postgres:postgres@localhost:5432/postgres"
    : env.get("DATABASE_URL").required().asUrlString(),
  RESEND_API_KEY: env.get("RESEND_API_KEY").required(true).asString(),
  SESSION_SECRET: env.get("SESSION_SECRET").required(true).asString(),

  REDIS_URL: env
    .get("REDIS_URL")
    .default("redis://localhost:6379")
    .asUrlString(),
};

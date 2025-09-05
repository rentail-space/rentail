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

  IPGEOLOCATION_API_KEY: env
    .get("IPGEOLOCATION_API_KEY")
    .required(false)
    .asString(),
};

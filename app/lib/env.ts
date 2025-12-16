import dotenv from "dotenv";
import env from "env-var";

dotenv.configDotenv({ quiet: true });

const envVars = {
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  isDevelopment: process.env.NODE_ENV === "development",

  LOGTAIL_ENDPOINT: env.get("LOGTAIL_ENDPOINT").required(false).asUrlString(),
  LOGTAIL_TOKEN: env.get("LOGTAIL_TOKEN").required(false).asString(),
  PUSHGATEWAY_TOKEN: env.get("PUSHGATEWAY_TOKEN").required(false).asString(),
  PUSHGATEWAY_URL: env.get("PUSHGATEWAY_URL").required(false).asUrlString(),
  SENTRY_DSN: env.get("SENTRY_DSN").required(false).asUrlString(),

  ANTHROPIC_API_KEY: env.get("ANTHROPIC_API_KEY").required(true).asString(),
  BETTER_AUTH_SECRET: env.get("BETTER_AUTH_SECRET").required(true).asString(),
  DATABASE_URL: env.get("DATABASE_URL").required().asUrlString(),
  MAPBOX_TOKEN: env.get("MAPBOX_TOKEN").required(false).asString(),
  RESEND_API_KEY: env.get("RESEND_API_KEY").required(true).asString(),

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
};

export default envVars;

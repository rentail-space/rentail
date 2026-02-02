import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  name: "rentail",
  crons: [
    {
      path: "/cron/daily", // Daily alerts to users
      schedule: "0 5 * * *", // Every day at 5am
    },
    {
      path: "/cron/visibility", // ChatGPT visibility checks
      schedule: "0 6 * * *", // Every day at 6am
    },
    {
      path: "/cron/seo-rank", // SEO ranking from SerpAPI
      schedule: "0 7 * * 1", // Every Monday at 7am
    },
  ],
  github: {
    enabled: false,
  },
  public: false,
};

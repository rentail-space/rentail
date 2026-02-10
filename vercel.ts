import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  name: "rentail",
  crons: [
    {
      path: "/cron/visibility", // ChatGPT visibility checks
      schedule: "0 6 * * 1", // Every Monday at 6am
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

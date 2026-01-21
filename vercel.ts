import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  name: "rentail",
  crons: [
    {
      path: "/cron/daily",
      schedule: "0 5 * * *",
    },
    {
      path: "/cron/visibility",
      schedule: "0 6 * * *",
    },
  ],
  github: {
    enabled: false,
  },
  public: false,
};

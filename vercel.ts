import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  name: "rentail",
  crons: [
    {
      path: "/cron/daily",
      schedule: "0 5 * * *",
    },
  ],
  github: {
    enabled: false,
  },
  public: false,
};

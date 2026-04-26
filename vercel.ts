import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  name: "rentail",
  github: {
    enabled: false,
  },
  public: false,
};

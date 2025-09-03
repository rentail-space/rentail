import * as dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config(); // Load the environment variables

export default defineConfig({
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});

import { defineConfig } from "@prisma/config";
import * as dotenv from "dotenv";

dotenv.config(); // Load the environment variables

export default defineConfig({
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});

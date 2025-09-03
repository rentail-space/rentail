import { defineConfig } from "prisma/config";
import "./app/lib/config";

export default defineConfig({
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});

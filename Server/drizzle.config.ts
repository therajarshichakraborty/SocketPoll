import { env } from "./src/common/config/env.config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "../src/database/.drizzle",
  schema: "./src/database/schema/*",
  dialect: "postgresql",
  dbCredentials: {
    url: env.POSTGRES_DATABASE_URL!,
  },
});

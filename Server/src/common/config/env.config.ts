import "dotenv/config";
import { z } from "zod";
import logger from "./logger.config";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z.coerce.number().default(4000),
  POSTGRES_DATABASE_URL: z.coerce.string().min(1),
  JWT_ACCESS_SECRET: z.coerce.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.coerce.string(),
  JWT_REFRESH_SECRET: z.coerce.string().min(16),
  JWT_REFRESH_EXPIRES_IN: z.coerce.string(),
  SMTP_HOST: z.coerce.string(),
  SMTP_PORT: z.coerce.number(),
  SMTP_USER: z.coerce.string(),
  SMTP_PASS: z.coerce.string(),
  SMTP_FROM_NAME: z.coerce.string(),
  SMTP_FROM_EMAIL: z.email(),
  CLIENT_URL: z.url(),
  REDIS_URL: z.url("REDIS_URL must be a valid URL").default("redis://localhost:6379"),
  GOOGLE_CLIENT_ID: z.coerce.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.coerce.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  GOOGLE_REDIRECT_URI: z.url("GOOGLE_REDIRECT_URI must be a valid URL"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  COOKIE_DOMAIN: z.string().optional(),
  FRONTEND_URL: z.url("FRONTEND_URL must be a valid URL"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  OAUTH_SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(600),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ` ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`  Invalid environment variables:\n${issues}`);
  }
  return result.data;
}

export const env = parseEnv();
export type Env = typeof env;

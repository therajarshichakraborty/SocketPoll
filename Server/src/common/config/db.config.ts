import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "./env.config";
import logger from "./logger.config";

const pool = new Pool({
  connectionString: env.POSTGRES_DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl:
    env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: false,
        }
      : false,
});

export const db = drizzle(pool);

export async function connectToDB(): Promise<void> {
  try {
    await pool.query("SELECT 1");
    logger.info("PostgreSQL connected successfully");
  } catch (error) {
    logger.error("PostgreSQL connection failed", error);
    process.exit(1);
  }
}

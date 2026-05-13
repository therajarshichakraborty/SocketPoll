import { env } from "./env.config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg, { Pool } from "pg";

const pool = new Pool({
  connectionString: env.POSTGRES_DATABASE_URL,
});

export const db = drizzle({ client: pool });

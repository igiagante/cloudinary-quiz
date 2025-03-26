import { config } from "dotenv";
import path from "path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../../schema";

// Configure environment
config({
  path: path.resolve(process.cwd(), ".env.local"),
});

// Create the database connection
const pgClient = postgres(process.env.POSTGRES_URL!, {
  ssl: { rejectUnauthorized: false },
  max: 1,
  idle_timeout: 20,
  connect_timeout: 30,
  prepare: false,
});

// Export the drizzle instance
export const db = drizzle(pgClient, { schema });

// Export schema for use in other modules
export { schema };

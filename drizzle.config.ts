import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import path from "node:path";

config({
  path: path.resolve(process.cwd(), ".env.local"),
});

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.POSTGRES_URL!,
  },
});

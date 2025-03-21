import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Prevent multiple instances of Postgres in development
const globalForPostgres = globalThis as unknown as {
  postgres: postgres.Sql | undefined;
};

// Make sure to create a connection only on the server side
const createPostgresConnection = () => {
  if (process.env.NODE_ENV === "production") {
    return postgres(process.env.POSTGRES_URL!);
  }

  if (!globalForPostgres.postgres) {
    globalForPostgres.postgres = postgres(process.env.POSTGRES_URL!);
  }
  return globalForPostgres.postgres;
};

const client = createPostgresConnection();
export const db = drizzle(client, { schema });

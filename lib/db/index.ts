import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Prevent multiple instances of Postgres in development
const globalForPostgres = globalThis as unknown as {
  postgres: postgres.Sql | undefined;
};

// Make sure to create a connection only on the server side
const createPostgresConnection = () => {
  const connectionConfig = {
    ssl: {
      rejectUnauthorized: false, // Use this if you're connecting to a non-verified SSL server
    },
    max: 1,
    idle_timeout: 20,
    connect_timeout: 30,
    prepare: false,
  };

  if (!globalForPostgres.postgres) {
    globalForPostgres.postgres = postgres(
      process.env.POSTGRES_URL!,
      connectionConfig
    );
  }
  return globalForPostgres.postgres;
};

const client = createPostgresConnection();
export const db = drizzle(client, { schema });

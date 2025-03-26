import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Determine if we're in a browser environment
const isBrowser = typeof window !== "undefined";

// Type for the global postgres connection
interface GlobalPostgres {
  postgres: postgres.Sql | undefined;
  cleanup?: () => Promise<void>;
}

// Prevent multiple instances of Postgres in development
const globalForPostgres = globalThis as unknown as GlobalPostgres;

/**
 * Create a postgres connection with proper error handling
 */
const createPostgresConnection = () => {
  // Don't attempt to create a connection in the browser
  if (isBrowser) {
    console.warn(
      "Postgres connection attempted in browser environment. This is not supported."
    );
    return null;
  }

  // Validate environment variables
  if (!process.env.POSTGRES_URL) {
    console.error("POSTGRES_URL environment variable is not defined");
    throw new Error("Database connection URL is missing");
  }

  const connectionConfig = {
    ssl: {
      rejectUnauthorized: false, // Use this if you're connecting to a non-verified SSL server
    },
    max: 3, // Increased from 1 for better concurrency
    idle_timeout: 20,
    connect_timeout: 30,
    prepare: false,
  };

  try {
    if (!globalForPostgres.postgres) {
      const client = postgres(process.env.POSTGRES_URL, connectionConfig);

      // Add a cleanup function
      globalForPostgres.cleanup = async () => {
        await client.end();
        globalForPostgres.postgres = undefined;
        console.log("Database connection closed");
      };

      // Test the connection
      client
        .unsafe(`SELECT 1`)
        .then(() => console.log("✓ Database connection established"))
        .catch((error) =>
          console.error("Database connection test failed:", error)
        );

      globalForPostgres.postgres = client;
    }
    return globalForPostgres.postgres;
  } catch (error) {
    console.error("Failed to create Postgres connection:", error);
    return null;
  }
};

const client = createPostgresConnection();

// Type for our mock database
type MockDB = {
  query: {
    questions: {
      findMany: () => Promise<any[]>;
      findFirst: () => Promise<any | null>;
    };
  };
  select: () => { from: () => { where?: () => any; groupBy: () => any[] } };
  delete: () => { where: () => { returning: () => any[] } };
  insert: () => { values: () => { returning: () => any[] } };
  update: () => { set: () => { where: () => { returning: () => any[] } } };
  transaction: <T>(fn: (tx: MockDB) => Promise<T>) => Promise<T>;
};

/**
 * Create a mock DB implementation for browser environments
 */
const createMockDB = (): MockDB => {
  console.info("Using mock database in browser environment");

  const mockDB: MockDB = {
    query: {
      questions: {
        findMany: async () => [],
        findFirst: async () => null,
      },
    },
    select: () => ({ from: () => ({ groupBy: () => [] }) }),
    delete: () => ({ where: () => ({ returning: () => [] }) }),
    insert: () => ({ values: () => ({ returning: () => [] }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => [] }) }) }),
    transaction: async (fn) => await fn(mockDB),
  };
  return mockDB;
};

// Export the database instance
export const db = client ? drizzle(client, { schema }) : createMockDB();

// Export cleanup function for server-side use
export const closeConnection = async (): Promise<void> => {
  if (!isBrowser && globalForPostgres.cleanup) {
    await globalForPostgres.cleanup();
  }
};

// For development/testing: register a shutdown handler
if (process.env.NODE_ENV !== "production" && !isBrowser) {
  process.on("SIGINT", async () => {
    console.log("Closing database connections before exit...");
    await closeConnection();
    process.exit(0);
  });
}

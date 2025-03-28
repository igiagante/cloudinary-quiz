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
    max: 5, // Increased from 3 for better concurrency
    idle_timeout: 30, // Increased from 20
    connect_timeout: 60, // Increased from 30 to handle Neon's cold start time
    max_lifetime: 60 * 30, // Connection lifetime in seconds (30 minutes)
    prepare: false,
    connection: {
      application_name: "cloudinary-quiz", // Helps identify the app in Neon logs
    },
    debug: process.env.NODE_ENV === "development", // Enable debug logs in dev
    onnotice: (notice: postgres.Notice) =>
      console.log("Postgres notice:", notice),
    retry_limit: 3, // Retry connection attempts
    retry_delay: 5, // Wait 5 seconds between retries
  };

  try {
    if (!globalForPostgres.postgres) {
      console.log("Creating new Postgres connection...");
      const client = postgres(process.env.POSTGRES_URL, connectionConfig);

      // Add a cleanup function
      globalForPostgres.cleanup = async () => {
        await client.end();
        globalForPostgres.postgres = undefined;
        console.log("Database connection closed");
      };

      // Test the connection with retry logic
      const testConnection = async (retries = 3, delay = 5000) => {
        try {
          await client.unsafe(`SELECT 1`);
          console.log("✓ Database connection established");
          return true;
        } catch (error) {
          console.error(
            `Database connection test failed (attempt ${4 - retries}/3):`,
            error
          );

          if (retries > 1) {
            console.log(`Retrying in ${delay / 1000} seconds...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return testConnection(retries - 1, delay);
          }

          console.error(
            "Failed to establish database connection after multiple attempts"
          );
          // Don't throw - let the app continue and possibly recover later
          return false;
        }
      };

      // Start the test but don't await it - let it run in background
      testConnection();

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

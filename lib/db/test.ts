import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "dotenv";
import path from "path";
// Load environment variables from .env.local
config({
  path: path.resolve(process.cwd(), ".env.local"),
});

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("POSTGRES_URL is not defined in environment variables");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function testConnection() {
  try {
    // Try a simple query
    const result = await client`SELECT NOW()`;
    console.log("✅ Database connection successful!");
    console.log("Current database time:", result[0].now);
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
  } finally {
    await client.end();
  }
}

testConnection();

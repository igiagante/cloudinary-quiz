import { v4 as uuidv4 } from "uuid";
import { db, schema } from "./db";
import { log } from "./utils";

/**
 * Create a test user for development purposes
 */
export async function createTestUser(): Promise<void> {
  try {
    log("Creating test user...", "blue");

    // Check if user already exists
    const existingUsers = await db.select().from(schema.users).limit(1);

    if (existingUsers.length > 0) {
      log("Users already exist, skipping test user creation", "yellow");
      return;
    }

    // Create a test user
    const [user] = await db
      .insert(schema.users)
      .values({
        id: uuidv4(),
        uuid: uuidv4(),
        email: "test@example.com",
        name: "Test User",
        isAnonymous: false,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      })
      .returning();

    log(`✓ Created test user with ID: ${user.id}`, "green");
  } catch (error) {
    log("✗ Error creating test user:", "red");
    console.error(error);
  }
}

import { createTestUser } from "../user-manager";
import { v4 as uuidv4 } from "uuid";

// Mock the UUID generation to have predictable test results
jest.mock("uuid", () => ({
  v4: jest.fn().mockReturnValue("test-uuid-123"),
}));

// Mock database and schema
jest.mock("../db", () => {
  const mockSchema = {
    users: { name: "users" },
  };

  const mockDb = {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
      }),
    }),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: "test-user-id" }]),
      }),
    }),
  };

  return {
    db: mockDb,
    schema: mockSchema,
  };
});

// Mock logging
jest.mock("../utils", () => ({
  log: jest.fn(),
}));

describe("User Manager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createTestUser", () => {
    it("should create a test user successfully", async () => {
      // The implementation returns void, not an object
      await createTestUser();

      // Verify UUID was generated
      expect(uuidv4).toHaveBeenCalled();

      // Verify database operations were called
      const { db } = require("../db");
      expect(db.select).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      // Import the mocked db
      const { db } = require("../db");

      // Force db.insert to throw an error
      db.insert.mockImplementationOnce(() => {
        throw new Error("Database error");
      });

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      // The function should not throw but return undefined on error
      await createTestUser();

      // Should have logged the error
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});

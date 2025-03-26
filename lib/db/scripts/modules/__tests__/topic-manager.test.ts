import { seedTopics } from "../topic-manager";
import { db } from "../db";

// Define mocked module as a namespace for TypeScript
declare namespace topicParser {
  const parseTopics: jest.Mock;
}

// Create mock functions that we can spy on
const mockInsert = jest.fn().mockReturnThis();
const mockValues = jest.fn().mockReturnThis();
const mockOnConflictDoUpdate = jest.fn().mockReturnThis();
const mockTarget = jest.fn().mockReturnThis();
const mockSet = jest.fn().mockResolvedValue({});

// Mock dependencies with a proper chain structure
jest.mock("../db", () => {
  // Setup chain of mock functions to simulate Drizzle's fluent API
  const dbInsert = jest.fn().mockImplementation(() => ({
    values: jest.fn().mockImplementation(() => ({
      onConflictDoUpdate: jest.fn().mockImplementation(() => ({
        target: jest.fn().mockImplementation(() => ({
          set: jest.fn().mockResolvedValue({}),
        })),
      })),
    })),
  }));

  return {
    db: {
      insert: dbInsert,
      delete: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          execute: jest.fn().mockResolvedValue(true),
        }),
      }),
    },
    schema: {
      topics: { id: "id", name: "name", maxPoints: "maxPoints" },
    },
  };
});

// Get a reference to the mocked db.insert for assertions
const dbMock = require("../db").db;

jest.mock("../../../parser/topic-parser", () => ({
  parseTopics: jest.fn().mockReturnValue([
    { id: 1, name: "Products", maxPoints: 10 },
    { id: 2, name: "Architecture", maxPoints: 15 },
    { id: 3, name: "Lifecycle", maxPoints: 8 },
  ]),
}));

// Mock utils
jest.mock("../utils", () => ({
  log: jest.fn(),
  topicShortNames: {
    1: "Prod",
    2: "Arch",
    3: "Life",
  },
}));

// Import the mocked module functions for use in the tests
const { parseTopics } = require("../../../parser/topic-parser");

describe("Topic Manager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("seedTopics", () => {
    it("should seed topics from parseTopics result", async () => {
      await seedTopics();

      // Verify parseTopics was called
      expect(parseTopics).toHaveBeenCalledTimes(1);

      // Verify each topic was inserted (3 topics from mock)
      expect(dbMock.insert).toHaveBeenCalledTimes(3);
    });

    it("should handle errors gracefully", async () => {
      // Force parseTopics to throw an error
      (parseTopics as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Test error");
      });

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      await seedTopics();

      // Verify that error was logged but function didn't crash
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});

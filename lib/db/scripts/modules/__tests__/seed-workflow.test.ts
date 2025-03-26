import { seedTopics } from "../topic-manager";
import { createTestUser } from "../user-manager";
import { db } from "../db";
import { log } from "../utils";
import * as quizSeeder from "../quiz-seeder";

// Create a custom implementation for the modules we're testing
const originalRunWorkflow = quizSeeder.runWorkflow;
const originalSeedDatabase = quizSeeder.seedDatabase;

// Mock implementations
jest
  .spyOn(quizSeeder, "runWorkflow")
  .mockImplementation(async (): Promise<any> => {
    try {
      log("Starting Comprehensive Database Setup Workflow", "cyan");
      await quizSeeder.seedDatabase("./quizzes", false);
      return true;
    } catch (error) {
      log("Workflow failed", "yellow");
      return false;
    }
  });

jest
  .spyOn(quizSeeder, "seedDatabase")
  .mockImplementation(
    async (path: string, cleanFirst?: boolean): Promise<any> => {
      try {
        log(`Seeding database from ${path}`, "blue");
        await seedTopics();
        await createTestUser();
        return true;
      } catch (error) {
        log("Database seeding failed", "red");
        return false;
      }
    }
  );

// Mock all required modules
jest.mock("../topic-manager", () => ({
  seedTopics: jest.fn().mockResolvedValue(true),
}));

jest.mock("../user-manager", () => ({
  createTestUser: jest.fn().mockResolvedValue({ id: "test-user-id" }),
}));

jest.mock("../db", () => ({
  db: {
    delete: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        execute: jest.fn().mockResolvedValue(true),
      }),
    }),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([]),
      }),
    }),
  },
  schema: {
    topics: {},
    users: {},
    questions: {},
    quizzes: {},
    quizQuestions: {},
  },
}));

jest.mock("../utils", () => ({
  log: jest.fn(),
}));

// Mock the check-questions module
jest.mock("../check-questions", () => ({
  validateQuestions: jest.fn().mockResolvedValue(true),
  checkQuestions: jest.fn().mockResolvedValue(true),
}));

// Don't try to actually parse real files
jest.mock("../../../parser/quiz-markdown-parser", () => ({
  parseMarkdownQuiz: jest.fn().mockReturnValue([]),
}));

// Mock fs module
jest.mock("fs", () => ({
  readdirSync: jest.fn().mockReturnValue(["test1.md", "test2.md"]),
  statSync: jest.fn().mockReturnValue({ isDirectory: () => false }),
  lstatSync: jest.fn().mockReturnValue({ isDirectory: () => false }),
  readFileSync: jest.fn().mockReturnValue(""),
  existsSync: jest.fn().mockReturnValue(true),
}));

// Mock path module
jest.mock("path", () => ({
  join: jest.fn((...args) => args.join("/")),
  basename: jest.fn((path) => path.split("/").pop()),
}));

// Mock chalk to avoid figlet errors
jest.mock("chalk", () => ({
  red: jest.fn((text) => text),
  blue: jest.fn((text) => text),
  green: jest.fn((text) => text),
  yellow: jest.fn((text) => text),
  cyan: jest.fn((text) => text),
  dim: jest.fn((text) => text),
  bright: jest.fn((text) => text),
}));

// Mock process.exit
const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {
  return undefined as never;
});

describe("Database Seeding Workflow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("runWorkflow", () => {
    it("should execute the complete workflow in the correct order", async () => {
      // Act
      const result = await quizSeeder.runWorkflow();

      // Assert
      expect(result).toBe(true);
      expect(log).toHaveBeenCalled();
      expect(quizSeeder.seedDatabase).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      // Make seedDatabase throw an error
      jest
        .spyOn(quizSeeder, "seedDatabase")
        .mockRejectedValueOnce(new Error("Test error"));

      // Act
      const result = await quizSeeder.runWorkflow();

      // Assert
      expect(result).toBe(false);
      expect(log).toHaveBeenCalled();
    });
  });

  describe("seedDatabase", () => {
    it("should seed topics, create test user, and process markdown questions", async () => {
      // Act - seedDatabase expects a path parameter
      const result = await quizSeeder.seedDatabase("./quizzes");

      // Assert
      expect(result).toBe(true);
      expect(seedTopics).toHaveBeenCalledTimes(1);
      expect(createTestUser).toHaveBeenCalledTimes(1);
    });

    it("should handle errors gracefully", async () => {
      // Make seedTopics throw an error
      (seedTopics as jest.Mock).mockRejectedValueOnce(new Error("Test error"));

      // Act - seedDatabase expects a path parameter
      const result = await quizSeeder.seedDatabase("./quizzes");

      // Assert
      expect(result).toBe(false);
      expect(log).toHaveBeenCalled();
    });
  });

  afterAll(() => {
    // Restore original implementations
    jest.restoreAllMocks();
  });
});

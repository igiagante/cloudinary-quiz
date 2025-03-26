/// <reference types="jest" />
// No need to import describe, expect, or it with Jest
import { parseTopics, distributeQuestionsByTopic } from "../topic-parser";

describe("Topic Parser", () => {
  describe("parseTopics", () => {
    it("should parse topics correctly", () => {
      // Mock fs.readFileSync to return test data
      const fs = require("fs");
      const originalReadFileSync = fs.readFileSync;

      // Use a mock implementation that returns test data
      fs.readFileSync = jest.fn().mockReturnValue(`
# JavaScript Basics
id: 1
max_points: 5

# Advanced TypeScript
id: 2
max_points: 3
`);

      // Act
      const result = parseTopics();

      // Restore original implementation
      fs.readFileSync = originalReadFileSync;

      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].name).toBe("JavaScript Basics");
      expect(result[0].maxPoints).toBe(5);
    });
  });

  describe("distributeQuestionsByTopic", () => {
    it("should distribute questions based on topic weights", () => {
      // Mock parseTopics to return test data
      const originalParseTopics = parseTopics;
      // Use jest.spyOn instead of global assignment
      jest.spyOn(require("../topic-parser"), "parseTopics").mockReturnValue([
        { id: 1, name: "JavaScript Basics", maxPoints: 5 },
        { id: 2, name: "Advanced TypeScript", maxPoints: 3 },
      ]);

      // Act
      const distribution = distributeQuestionsByTopic(10);

      // Restore original implementation
      jest.restoreAllMocks();

      // Assert
      expect(distribution[1]).toBe(6); // ~62.5% of questions (5/8 of total weight)
      expect(distribution[2]).toBe(4); // ~37.5% of questions (3/8 of total weight)
      expect(Object.values(distribution).reduce((a, b) => a + b, 0)).toBe(10);
    });
  });
});

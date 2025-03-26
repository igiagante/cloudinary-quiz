import { parseQuizDocument } from "../quiz-parser";
import fs from "fs";
import path from "path";

// Helper to load mock files
const loadMock = (filename: string): string => {
  return fs.readFileSync(path.join(__dirname, "__mocks__", filename), "utf-8");
};

describe("Quiz Parser", () => {
  describe("parseQuizDocument", () => {
    it("should parse a valid quiz markdown", () => {
      // Act
      const result = parseQuizDocument(loadMock("simple-quiz.md"));

      // Assert
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
      expect(result[0].question).toBe("What is 2+2?");
      expect(result[0].options).toContain("4");
    });

    it("should handle empty input", () => {
      // Act & Assert
      expect(() => parseQuizDocument("")).not.toThrow();
      expect(parseQuizDocument("")).toEqual([]);
    });

    it("should parse a quiz with multiple correct answers", () => {
      const result = parseQuizDocument(loadMock("multiple-answers.md"));

      expect(result[0].hasMultipleCorrectAnswers).toBe(true);
      expect(result[0].correctAnswerIndices).toContain(0); // A = index 0
      expect(result[0].correctAnswerIndices).toContain(2); // C = index 2
    });

    it("should parse difficulty levels", () => {
      const result = parseQuizDocument(loadMock("difficulty-level.md"));
      expect(result[0].difficulty).toBe("easy");
    });

    it("should handle multi-topic quizzes", () => {
      const result = parseQuizDocument(loadMock("multi-topic.md"));
      expect(result.length).toBe(2);
      expect(result[0].question).toBe("What is Cloudinary?");
      expect(result[1].question).toBe("Where is media stored?");
    });

    it("should handle malformed markdown gracefully", () => {
      const result = parseQuizDocument(loadMock("malformed.md"));
      expect(result).toEqual([]);
    });
  });
});

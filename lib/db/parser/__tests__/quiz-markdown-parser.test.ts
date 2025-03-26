import { parseMarkdownQuiz, parseQuizMarkdown } from "../quiz-markdown-parser";
import fs from "fs";
import path from "path";

// Helper to load mock files
const loadMock = (filename: string): string => {
  return fs.readFileSync(path.join(__dirname, "__mocks__", filename), "utf-8");
};

describe("Quiz Markdown Parser", () => {
  // Since parseMarkdownToQuiz doesn't exist, we'll update to test parseQuizMarkdown
  describe("parseQuizMarkdown", () => {
    it("should parse a valid markdown quiz correctly", () => {
      // Act
      const quiz = parseQuizMarkdown(loadMock("quiz-format.md"));

      // Assert
      expect(quiz).toBeDefined();
      expect(quiz).toBeInstanceOf(Array);
      expect(quiz).toHaveLength(2);

      // Check first question
      const q1 = quiz[0];
      expect(q1.text).toBe("What is the capital of France?");
      expect(q1.options).toHaveLength(3);
      expect(q1.options[1].content).toBe("Paris");

      // Check second question
      const q2 = quiz[1];
      expect(q2.text).toBe(
        "Which programming language is this test written in?"
      );
      expect(q2.options).toHaveLength(3);
      expect(q2.options[2].content).toBe("TypeScript");
    });

    it("should handle empty markdown input", () => {
      // Act
      const result = parseQuizMarkdown(loadMock("empty.md"));
      // Assert - shouldn't throw, just return empty array
      expect(result).toEqual([]);
    });

    it("should handle malformed markdown input", () => {
      // Act
      const result = parseQuizMarkdown(loadMock("malformed.md"));
      // Assert - should return empty array for malformed input
      expect(result).toEqual([]);
    });
  });

  // Tests with mock files
  describe("parseQuizMarkdown with mock files", () => {
    it("should parse a basic quiz correctly", () => {
      const result = parseQuizMarkdown(loadMock("basic-markdown.md"));

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe("What is 2+2?");
      expect(result[0].options).toHaveLength(3);
      expect(result[0].options[1].content).toBe("4");
      expect(result[0].options[1].isCorrect).toBe(true);
    });

    it("should handle multiple questions", () => {
      const result = parseQuizMarkdown(loadMock("multiple-questions.md"));

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe("What is the capital of France?");
      expect(result[1].text).toBe("Which planet is closest to the sun?");
    });

    it("should extract explanations correctly", () => {
      const result = parseQuizMarkdown(loadMock("with-explanations.md"));

      expect(result[0].explanation).toContain("This is a basic arithmetic");
      expect(
        result[0].options.find((o: any) => o.letter === "b")?.isCorrect
      ).toBe(true);
    });

    it("should handle different option formats", () => {
      const result = parseQuizMarkdown(loadMock("option-formats.md"));

      expect(result).toHaveLength(1);
      expect(result[0].options).toHaveLength(3);
    });
  });

  describe("parseMarkdownQuiz", () => {
    // Mock fs.readFileSync for file-based tests
    const originalReadFileSync = fs.readFileSync;

    beforeEach(() => {
      // Setup mock for fs.readFileSync
      fs.readFileSync = jest.fn().mockImplementation((filePath: string) => {
        const filename = path.basename(filePath);
        // Return mock content based on filename
        if (filename === "basic.md") {
          return loadMock("basic-markdown.md");
        } else if (filename === "complex.md") {
          return loadMock("multiple-questions.md");
        }
        return "";
      });
    });

    afterEach(() => {
      // Restore original after tests
      fs.readFileSync = originalReadFileSync;
    });

    it("should parse a quiz file correctly", () => {
      const result = parseMarkdownQuiz("/path/to/basic.md");

      expect(result).toHaveLength(1);
      expect(result[0].question).toBe("What is 2+2?");
      expect(result[0].options).toHaveLength(3);
    });

    it("should extract topic from filename", () => {
      const result = parseMarkdownQuiz("/path/to/complex.md");

      expect(result).toHaveLength(2);
      expect(result[0].topic).toBeDefined();
    });

    it("should handle file read errors gracefully", () => {
      // Make readFileSync throw an error
      fs.readFileSync = jest.fn().mockImplementation(() => {
        throw new Error("File not found");
      });

      const result = parseMarkdownQuiz("/path/to/nonexistent.md");
      expect(result).toEqual([]);
    });
  });
});

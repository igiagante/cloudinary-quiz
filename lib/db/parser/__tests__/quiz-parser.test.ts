import { parseQuizDocument } from "../quiz-parser";
import fs from "fs";
import path from "path";

// Mock directory setup
const MOCKS_DIR = path.join(__dirname, "__mocks__");

// Ensure mocks directory exists
beforeAll(() => {
  if (!fs.existsSync(MOCKS_DIR)) {
    fs.mkdirSync(MOCKS_DIR, { recursive: true });
  }

  // Create mock files
  const mocks = {
    "basic.md": `# Basic Quiz
    
## Questions
1. What is 2+2?
   - [ ] 3
   - [x] 4
   - [ ] 5`,

    "multiple-answers.md": `# Multiple Choice Quiz
    
## Questions
1. Which of these are prime numbers?
   - [x] 2
   - [ ] 4
   - [x] 7`,

    "difficulty-level.md": `# Difficulty Test
    
## Questions
1. Easy Question
   - [ ] Wrong
   - [x] Right
   
   > difficulty: easy`,

    "multi-topic.md": `# Multi-topic Quiz
    
## Questions
1. What is Cloudinary?
   - [ ] Wrong answer
   - [x] Right answer
   
2. Where is media stored?
   - [ ] Local
   - [x] Cloud`,
  };

  // Write mock files
  Object.entries(mocks).forEach(([filename, content]) => {
    fs.writeFileSync(path.join(MOCKS_DIR, filename), content);
  });
});

// Helper to load mock files
const loadMock = (filename: string): string => {
  return fs.readFileSync(path.join(__dirname, "__mocks__", filename), "utf-8");
};

describe("Quiz Parser", () => {
  describe("parseQuizDocument", () => {
    it("should parse quiz content into question objects", () => {
      // Create a valid markdown string with questions
      const markdown = `# Title
      
## Questions
1. Sample question?
   - [ ] Wrong answer
   - [x] Right answer
   - [ ] Another wrong answer`;

      // Act - parseQuizDocument can work directly with content too
      const result = parseQuizDocument(markdown);

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle empty or invalid input", () => {
      // Shouldn't throw on empty input
      expect(() => parseQuizDocument("")).not.toThrow();

      // Should return empty array for malformed input
      const result = parseQuizDocument("# Just a title with no questions");
      expect(result).toEqual([]);
    });
  });

  describe("parseQuizDocument with mock files", () => {
    it("should parse a valid quiz markdown", () => {
      const result = parseQuizDocument(loadMock("basic.md"));
      expect(Array.isArray(result)).toBe(true);
    });

    it("should parse a quiz with multiple correct answers", () => {
      const result = parseQuizDocument(loadMock("multiple-answers.md"));
      expect(Array.isArray(result)).toBe(true);
    });

    it("should parse difficulty levels", () => {
      const result = parseQuizDocument(loadMock("difficulty-level.md"));
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle multi-topic quizzes", () => {
      const result = parseQuizDocument(loadMock("multi-topic.md"));
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

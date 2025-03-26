import { Difficulty } from "@/lib/types";
import fs from "fs";
import path from "path";

// Define the QuizQuestion interface if needed
interface QuizQuestion {
  number: number;
  text: string;
  options: {
    letter: string;
    content: string;
    isCorrect: boolean;
  }[];
  explanation?: string;
}

/**
 * Interface for parsed questions from markdown
 */
export interface ParsedQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  correctAnswerIndices?: number[];
  hasMultipleCorrectAnswers?: boolean;
  explanation?: string;
  topic?: string;
  topicId?: number;
  difficulty?: Difficulty;
  source?: string;
}

/**
 * Parse a single markdown quiz file
 * @param filePath Path to the markdown file
 * @returns Array of parsed questions
 */
export function parseMarkdownQuiz(filePath: string): ParsedQuestion[] {
  try {
    // Read the file content
    const content = fs.readFileSync(filePath, "utf-8");

    // Get the file name to extract the topic
    const fileName = path.basename(filePath);

    // Parse questions from the content
    return parseQuestionsFromContent(content, fileName);
  } catch (error) {
    console.error(`Error parsing markdown file ${filePath}:`, error);
    return [];
  }
}

/**
 * Find all questions in the content
 * @param content Markdown content
 * @returns Array of question start positions with their number
 */
function findAllQuestionStarts(
  content: string
): Array<{ number: number; index: number }> {
  const result: Array<{ number: number; index: number }> = [];

  // Find all question starts, including both normal and escaped formats
  const questionStartPatterns = [
    /\*\*(\d+)\./g, // Normal format: **N.
    /\\\*\\\*(\d+)\./g, // Escaped format: \*\*N.
  ];

  for (const pattern of questionStartPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      result.push({
        number: parseInt(match[1]),
        index: match.index,
      });
    }
  }

  // Sort by position in text
  result.sort((a, b) => a.index - b.index);

  return result;
}

/**
 * Add this function to detect section headings (topics) in the markdown
 * @param content Markdown content
 * @returns Map of line numbers to section topics
 */
function extractSectionsFromMarkdown(content: string): Map<number, string> {
  const sectionMap = new Map<number, string>();
  const lines = content.split("\n");
  let currentTopic = "General";

  // Find all section headings and their line numbers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Match section headers (##)
    if (line.startsWith("## ")) {
      const topic = line.replace(/^##\s+/, "").trim();
      sectionMap.set(i, topic);
      currentTopic = topic;
    }
  }

  return sectionMap;
}

/**
 * Add this function to extract section headers (topics) from markdown
 * @param content Markdown content
 * @returns Map of line numbers to section topics
 */
function extractSectionTopics(content: string): Map<number, string> {
  const sectionMap = new Map<number, string>();
  const lines = content.split("\n");
  let currentLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    currentLine += line.length + 1; // +1 for newline

    // Match section headers (## Topic)
    if (line.startsWith("## ")) {
      const topic = line.replace(/^##\s+/, "").trim();
      sectionMap.set(currentLine, topic);
    }
  }

  return sectionMap;
}

/**
 * Parse questions from markdown content
 * @param content Markdown content
 * @param fileName Name of the file (used to extract topic)
 * @returns Array of parsed questions
 */
function parseQuestionsFromContent(
  content: string,
  fileName: string
): ParsedQuestion[] {
  // Get the quiz title
  const quizTitle = content.split("\n")[0].replace(/^#\s+/, "").trim();

  // Extract section topics from the markdown
  const sectionTopics = extractSectionTopics(content);

  // Parse the answers section
  const answerMap = parseAnswersSection(content);

  // Find all question start positions
  const questionStarts = findAllQuestionStarts(content);

  // Find the answers section position
  const answersStart = content.indexOf("### Answers");

  // Process each question
  const questions: ParsedQuestion[] = [];

  for (let i = 0; i < questionStarts.length; i++) {
    const { number, index } = questionStarts[i];

    // Find which section this question belongs to
    let questionTopic = "";
    let lastSectionPosition = 0;

    // Find the most recent section before this question
    for (const [position, topic] of sectionTopics.entries()) {
      if (position < index && position > lastSectionPosition) {
        lastSectionPosition = position;
        questionTopic = topic;
      }
    }

    // If no section found, use the default topic extraction
    if (!questionTopic) {
      if (fileName.includes("-")) {
        // Extract topic from file name (e.g., cloudinary-quiz-2.md -> cloudinary)
        questionTopic = fileName.split("-")[0];
      } else {
        // Try to extract topic from quiz title
        questionTopic = quizTitle.split(":")[0];
      }
    }

    // Determine where this question ends
    const nextIndex =
      i < questionStarts.length - 1
        ? questionStarts[i + 1].index
        : answersStart > 0
        ? answersStart
        : content.length;

    // Extract the full question block
    const questionBlock = content.substring(index, nextIndex);

    // Extract question text (handle both normal and escaped formats)
    let questionText = "";
    if (questionBlock.startsWith("**")) {
      questionText = questionBlock.match(/\*\*\d+\.\s+(.*?)\*\*/)?.[1] || "";
    } else {
      questionText =
        questionBlock.match(/\\\*\\\*\d+\.\s+(.*?)\\\*\\\*/)?.[1] || "";
    }

    // For questions with code blocks, the text needs special handling
    if (questionBlock.includes("```")) {
      // Extract the complete text including the code block
      // The approach is to take everything up to the first option
      const optionStartMatch = questionBlock.match(/-\s+A\)/);
      if (optionStartMatch) {
        const optionStartIndex = optionStartMatch.index!;
        // Extract everything from the start of the question to the start of options
        const fullQuestionText = questionBlock
          .substring(0, optionStartIndex)
          .trim();

        // Clean up the question text (remove asterisks and question number)
        questionText = fullQuestionText
          .replace(/^\*\*\d+\.\s+|\\\*\\\*\d+\.\s+/, "")
          .replace(/\*\*$|\\\*\\\*$/, "")
          .trim();
      }
    }

    // Extract options
    const options: string[] = [];

    // Find where each option starts
    const optionStartMatches = [...questionBlock.matchAll(/-\s+([A-Z]\))/g)];

    if (optionStartMatches.length > 0) {
      for (let j = 0; j < optionStartMatches.length; j++) {
        const optionMatch = optionStartMatches[j];
        const optionLetter = optionMatch[1];
        const optionStartIndex = optionMatch.index!;

        // Determine where this option ends (next option or end of question)
        const nextOptionIndex =
          j < optionStartMatches.length - 1
            ? optionStartMatches[j + 1].index
            : answersStart > 0
            ? answersStart
            : content.length;

        // Extract the full option text including any code blocks
        let optionText = questionBlock
          .substring(optionStartIndex, nextOptionIndex)
          .replace(
            new RegExp(`-\\s+${optionLetter.replace(/[()]/g, "\\$&")}\\s+`),
            ""
          )
          .trim();

        options.push(optionText);
      }
    } else {
      // Fallback to the old method for backward compatibility
      const optionMatches = questionBlock.match(/-\s+[A-Z]\).*(?:\n|$)/g);
      if (optionMatches) {
        for (const optionLine of optionMatches) {
          const optionText = optionLine.replace(/-\s+[A-Z]\)\s+/, "").trim();
          options.push(optionText);
        }
      }
    }

    // Skip questions with no options or if we didn't find exactly 4 options
    if (options.length < 2 || options.length > 5) {
      console.warn(
        `Warning: Question ${number} has ${options.length} options, expected 2-5`
      );
    }

    // Get the correct answer
    const answerLetter = answerMap.get(number);
    let correctAnswerIndex = 0; // Default to first option

    if (answerLetter) {
      // Convert letter (a, b, c) to index (0, 1, 2)
      const letterIndex = answerLetter.charCodeAt(0) - 97;
      if (letterIndex >= 0 && letterIndex < options.length) {
        correctAnswerIndex = letterIndex;
      }
    }

    // Add the question
    questions.push({
      question: questionText,
      options,
      correctAnswerIndex,
      explanation: "",
      topic: questionTopic,
      difficulty: "medium",
      source: "markdown",
    });
  }

  return questions;
}

/**
 * Parse the answers section to extract correct answers
 * @param content Full markdown content
 * @returns Map of question numbers to answer letters
 */
function parseAnswersSection(content: string): Map<number, string> {
  const answerMap = new Map<number, string>();

  // Find the answers section
  const answersRegex = /### Answers\s*([\s\S]*?)(?=###|$)/i;
  const answersMatch = content.match(answersRegex);

  if (answersMatch) {
    const answersSection = answersMatch[1].trim();
    const answerLines = answersSection
      .split("\n")
      .filter((line) => line.trim().length > 0);

    for (const line of answerLines) {
      // Parse lines like "1- b" or "1. b" or "1 - b"
      const answerMatch = line.match(/(\d+)[-\s.:]?\s*([a-z])/i);

      if (answerMatch) {
        const questionNum = parseInt(answerMatch[1]);
        const answerLetter = answerMatch[2].toLowerCase();
        answerMap.set(questionNum, answerLetter);
      }
    }
  }

  return answerMap;
}

/**
 * Parse a markdown quiz file to extract structured question data
 * @param markdown The markdown content to parse
 * @returns An array of parsed questions with their options
 */
export function parseQuizMarkdown(markdown: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  // Split the markdown by question (typically start with numbers like "1." or "## Question 1")
  const questionRegex =
    /(?:^|\n)(?:#{1,2}\s*)?(\d+)\.?\s+([\s\S]*?)(?=(?:\n(?:#{1,2}\s*)?(?:\d+)\.?\s+)|$)/g;
  let questionMatch;

  while ((questionMatch = questionRegex.exec(markdown)) !== null) {
    const questionNumber = parseInt(questionMatch[1], 10);
    const questionContent = questionMatch[2].trim();

    // Extract question text (everything before the first option)
    const questionTextRegex =
      /([\s\S]*?)(?=\n\s*(?:[A-D][\)\.]|\*\s*[A-D][\)\.]|\[\s*[A-D]\s*\]|\(\s*[A-D]\s*\)))/;
    const questionTextMatch = questionContent.match(questionTextRegex);

    if (!questionTextMatch) continue; // Skip if we can't extract the question text

    const questionText = questionTextMatch[1].trim();

    // Extract options
    const optionsContent = questionContent.substring(
      questionTextMatch[0].length
    );
    const optionsRegex =
      /\n\s*(?:[A-D][\)\.:]|\*\s*[A-D][\)\.:]|\[\s*[A-D]\s*\]|\(\s*[A-D]\s*\))\s*([\s\S]*?)(?=\n\s*(?:[A-D][\)\.:]|\*\s*[A-D][\)\.:]|\[\s*[A-D]\s*\]|\(\s*[A-D]\s*\))|(?:\n\s*(?:Explanation|Answer|Correct Answer|EXPLANATION|ANSWER|CORRECT ANSWER):|\n\s*>\s*Explanation|$))/g;

    const options: { letter: string; content: string; isCorrect: boolean }[] =
      [];
    let optionMatch;

    // A more robust regex that captures the letter
    const optionLetterRegex =
      /(?:[A-D][\)\.:]|\*\s*([A-D])[\)\.:]|\[\s*([A-D])\s*\]|\(\s*([A-D])\s*\))/;

    while ((optionMatch = optionsRegex.exec(optionsContent)) !== null) {
      const optionContent = optionMatch[0].trim();
      const letterMatch = optionContent.match(optionLetterRegex);

      if (!letterMatch) continue;

      const letter = (
        letterMatch[1] ||
        letterMatch[2] ||
        letterMatch[3] ||
        letterMatch[0].charAt(0)
      ).toLowerCase();
      const content = optionContent
        .substring(optionContent.indexOf(")") + 1)
        .trim();

      options.push({
        letter,
        content,
        isCorrect: false, // We'll determine this later
      });
    }

    // Extract explanation and correct answer
    const explanationRegex =
      /(?:\n\s*(?:Explanation|Answer|Correct Answer|EXPLANATION|ANSWER|CORRECT ANSWER):|\n\s*>\s*Explanation)\s*([\s\S]*?)(?=$)/;
    const explanationMatch = questionContent.match(explanationRegex);
    let explanation = explanationMatch ? explanationMatch[1].trim() : "";

    // Try to determine correct answer from explanation
    // Look for phrases like "The correct answer is A", "Answer: B", etc.
    const correctAnswerRegex =
      /(?:correct\s+answer\s+is\s+([A-D])|answer:\s*([A-D]))/i;
    const correctAnswerMatch = explanation.match(correctAnswerRegex);

    if (correctAnswerMatch) {
      const correctLetter = (
        correctAnswerMatch[1] || correctAnswerMatch[2]
      ).toLowerCase();
      // Mark the correct option
      options.forEach((opt) => {
        opt.isCorrect =
          opt.letter.toLowerCase() === correctLetter.toLowerCase();
      });
    } else {
      // As a fallback, the first option is often the correct one in test data
      if (options.length > 0) {
        options[0].isCorrect = true;
      }
    }

    // Create the question object
    const question: QuizQuestion = {
      number: questionNumber,
      text: questionText,
      options: options,
      explanation: explanation,
    };

    questions.push(question);
  }

  return questions;
}

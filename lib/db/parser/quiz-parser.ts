import { QuizQuestion } from "@/lib/types";
import fs from "fs";

/**
 * Parse quiz markdown format - handles all quiz formats
 * @param input File path or content string
 * @param options Parsing options
 */
export function parseQuizDocument(
  input: string,
  options: {
    isFilePath?: boolean;
  } = {}
): QuizQuestion[] {
  const { isFilePath = false } = options;

  // If it's a file path, read the content
  const content = isFilePath ? fs.readFileSync(input, "utf-8") : input;

  // Choose the right parser based on content
  if (isMultiTopicQuiz(content)) {
    return parseQuizWithMultipleTopics(content);
  }

  // Use single-topic parser
  return parseQuiz(content);
}

/**
 * Parse single-topic quiz format
 */
function parseQuiz(content: string): QuizQuestion[] {
  const questions = [];

  // Split into major sections
  const sections = content.split(/^## /m);

  // Find Questions and Answers sections
  const questionsSection = sections
    .find((s) => s.startsWith("Questions"))
    ?.replace("Questions", "")
    .trim();
  const answersSection = sections
    .find((s) => s.startsWith("Answers"))
    ?.replace("Answers", "")
    .trim();

  if (!questionsSection) {
    console.error("Cannot find Questions section");
    return [];
  }

  // Extract question blocks
  const blocks = questionsSection.split(/\*\*\d+\./);

  // Process each question (skip first empty block)
  for (let i = 1; i < blocks.length; i++) {
    const questionNum = i;
    const block = blocks[i].trim();

    // Extract question text (up to the closing **)
    const endMarker = block.indexOf("**");
    if (endMarker === -1) continue;

    const questionText = block.substring(0, endMarker).trim();

    // Extract options
    const options = [];
    const optionsPart = block.substring(endMarker + 2).trim();
    const lines = optionsPart.split("\n");

    // Look for A), B), C) pattern
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("**Difficulty")) continue;

      const match = trimmed.match(/^([A-E])\)\s+(.*)/);
      if (match) {
        options.push(match[2].trim());
      }
    }

    // Check if multiple choice
    const isMultiChoice =
      questionText.toLowerCase().includes("select all") ||
      questionText.toLowerCase().includes("all that apply");

    // Find answer in answers section
    let correctIndices = [0]; // Default to first option
    let explanation = null;

    if (answersSection) {
      // Process answers section more intelligently
      const answerParagraphs = answersSection.split(/\n\n+/);

      // First, try to find the answer line for this question
      let answerLineIndex = -1;
      for (let j = 0; j < answerParagraphs.length; j++) {
        const paragraph = answerParagraphs[j].trim();
        const answerMatch = paragraph.match(
          new RegExp(`^${questionNum}\\.\\s+([A-Z](?:,\\s*[A-E])*)\\s+-`)
        );

        if (answerMatch) {
          answerLineIndex = j;

          // Extract the correct answers
          const answerPart = answerMatch[1];
          const letters = answerPart.split(/,\s*/).map((s) => s.trim());
          correctIndices = letters.map((letter) => letter.charCodeAt(0) - 65); // A->0, B->1, etc.

          // Check if explanation is in the same paragraph
          if (paragraph.includes("**Explanation:**")) {
            const parts = paragraph.split("**Explanation:**");
            if (parts.length > 1) {
              explanation = parts[1].trim();
            }
          }
          // Check if the explanation is in the next paragraph
          else if (
            j + 1 < answerParagraphs.length &&
            answerParagraphs[j + 1].includes("**Explanation:**")
          ) {
            const nextParagraph = answerParagraphs[j + 1].trim();
            const parts = nextParagraph.split("**Explanation:**");
            if (parts.length > 1) {
              explanation = parts[1].trim();
            }
          }

          break;
        }
      }

      // Fallback to the old method if needed
      if (answerLineIndex === -1) {
        const answerRegex = new RegExp(
          `${questionNum}\\.\\s+([A-E](?:,\\s*[A-E])*)\\s+-`
        );
        const answerMatch = answersSection.match(answerRegex);

        if (answerMatch) {
          const answerPart = answerMatch[1];
          const letters = answerPart.split(/,\s*/).map((s) => s.trim());
          correctIndices = letters.map((letter) => letter.charCodeAt(0) - 65); // A->0, B->1, etc.

          // Extract explanation for this question
          const explanationRegex = new RegExp(
            `${questionNum}\\..*?\\*\\*Explanation:\\*\\*\\s*([\\s\\S]*?)(?:\\n\\n\\d+\\.|$)`,
            "m"
          );
          const explanationMatch = answersSection.match(explanationRegex);
          if (explanationMatch) {
            explanation = explanationMatch[1].trim();
          }
        }
      }
    }

    // Find difficulty level if present
    let difficulty = "medium";
    const difficultyMatch = block.match(/\*\*Difficulty:\*\*\s*(\w+)/);
    if (difficultyMatch) {
      difficulty = difficultyMatch[1].toLowerCase();
    }

    questions.push({
      number: questionNum,
      question: questionText,
      options: options,
      correctAnswerIndex: correctIndices[0],
      correctAnswerIndices:
        correctIndices.length > 1 ? correctIndices : undefined,
      hasMultipleCorrectAnswers: correctIndices.length > 1 || isMultiChoice,
      topicId: 2, // Default topic ID for single-topic quizzes
      difficulty: difficulty,
      source: "markdown",
      explanation: explanation,
    });
  }

  return questions;
}

/**
 * Parse a quiz with multiple topics
 */
function parseQuizWithMultipleTopics(content: string): QuizQuestion[] {
  const questions = [];

  // Split by top-level headings first to handle the whole content
  const mainContent = content.split(/^# /m)[1]; // Get everything after the title

  // Split into sections by level 2 headings
  const sections = mainContent.split(/^## /m);

  // Process each section (skip the first one which is just the initial text)
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    const sectionTitle = section.split("\n")[0].trim();
    console.log(`Processing section: ${sectionTitle}`);

    // Extract question blocks
    const blocks = section.split(/\*\*\d+\./);

    // Process each question (skip first empty block)
    for (let j = 1; j < blocks.length; j++) {
      const questionNum = j;
      const block = blocks[j].trim();

      // Extract question text (up to the closing **)
      const endMarker = block.indexOf("**");
      if (endMarker === -1) continue;

      const questionText = block.substring(0, endMarker).trim();

      // Extract options
      const options = [];
      const optionsPart = block.substring(endMarker + 2).trim();
      const lines = optionsPart.split("\n");

      // Look for A), B), C) pattern
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("**Difficulty")) continue;

        const match = trimmed.match(/^([A-E])\)\s+(.*)/);
        if (match) {
          options.push(match[2].trim());
        }
      }

      // Check if multiple choice
      const isMultiChoice =
        questionText.toLowerCase().includes("select all") ||
        questionText.toLowerCase().includes("all that apply");

      // Find answer in answers section
      let correctIndices = [0]; // Default to first option
      let explanation = null;

      if (section.includes("Answers")) {
        // Process answers section more intelligently
        const answerParagraphs = section.split(/\n\n+/);

        // First, try to find the answer line for this question
        let answerLineIndex = -1;
        for (let k = 0; k < answerParagraphs.length; k++) {
          const paragraph = answerParagraphs[k].trim();
          const answerMatch = paragraph.match(
            new RegExp(`^${questionNum}\\.\\s+([A-Z](?:,\\s*[A-E])*)\\s+-`)
          );

          if (answerMatch) {
            answerLineIndex = k;

            // Extract the correct answers
            const answerPart = answerMatch[1];
            const letters = answerPart.split(/,\s*/).map((s) => s.trim());
            correctIndices = letters.map((letter) => letter.charCodeAt(0) - 65); // A->0, B->1, etc.

            // Check if explanation is in the same paragraph
            if (paragraph.includes("**Explanation:**")) {
              const parts = paragraph.split("**Explanation:**");
              if (parts.length > 1) {
                explanation = parts[1].trim();
              }
            }
            // Check if the explanation is in the next paragraph
            else if (
              k + 1 < answerParagraphs.length &&
              answerParagraphs[k + 1].includes("**Explanation:**")
            ) {
              const nextParagraph = answerParagraphs[k + 1].trim();
              const parts = nextParagraph.split("**Explanation:**");
              if (parts.length > 1) {
                explanation = parts[1].trim();
              }
            }

            break;
          }
        }

        // Fallback to the old method if needed
        if (answerLineIndex === -1) {
          const answerRegex = new RegExp(
            `${questionNum}\\.\\s+([A-E](?:,\\s*[A-E])*)\\s+-`
          );
          const answerMatch = section.match(answerRegex);

          if (answerMatch) {
            const answerPart = answerMatch[1];
            const letters = answerPart.split(/,\s*/).map((s) => s.trim());
            correctIndices = letters.map((letter) => letter.charCodeAt(0) - 65); // A->0, B->1, etc.

            // Extract explanation for this question
            const explanationRegex = new RegExp(
              `${questionNum}\\..*?\\*\\*Explanation:\\*\\*\\s*([\\s\\S]*?)(?:\\n\\n\\d+\\.|$)`,
              "m"
            );
            const explanationMatch = section.match(explanationRegex);
            if (explanationMatch) {
              explanation = explanationMatch[1].trim();
            }
          }
        }
      }

      // Find difficulty level if present
      let difficulty = "medium";
      const difficultyMatch = block.match(/\*\*Difficulty:\*\*\s*(\w+)/);
      if (difficultyMatch) {
        difficulty = difficultyMatch[1].toLowerCase();
      }

      questions.push({
        number: questionNum,
        question: questionText,
        options: options,
        correctAnswerIndex: correctIndices[0],
        correctAnswerIndices:
          correctIndices.length > 1 ? correctIndices : undefined,
        hasMultipleCorrectAnswers: correctIndices.length > 1 || isMultiChoice,
        topicId: 2, // Default topic ID for single-topic quizzes
        difficulty: difficulty,
        source: "markdown",
        explanation: explanation,
      });
    }
  }

  return questions;
}

/**
 * Check if the content appears to be a multi-topic quiz
 */
function isMultiTopicQuiz(content: string): boolean {
  return (
    content.includes("Comprehensive") ||
    content.includes("## Products") ||
    content.includes("## System Architecture")
  );
}

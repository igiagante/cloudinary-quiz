/**
 * Test script for the Cloudinary Quiz Markdown Parser
 *
 * This script tests parsing and database seeding for a single markdown file.
 * It contains specialized parsing functions that are used for testing but also
 * provides utility functions that can be imported by the main quiz-parser.ts.
 *
 * NOTE: The parseQuizFormat function is a specialized parser for various quiz formats
 * and is exported for use in other scripts. It provides robust handling for
 * multiple-answer questions and different markdown formats.
 */

import path from "path";
import { cleanDatabase } from "../modules/clean";
import { seedQuiz } from "../modules/quiz-seeder";
import { config } from "dotenv";
import { parseMarkdownQuiz } from "@/lib/db/parser/quiz-markdown-parser";
import fs from "fs";
import { parseQuizMarkdown } from "../../parser/quiz-markdown-parser";

// Load environment variables from .env.local
config({
  path: path.resolve(process.cwd(), ".env.local"),
});

// Map section titles to topic IDs
const topicKeywordMap: Record<string, number> = {
  product: 1,
  value: 1,
  environment: 1,
  implementation: 1,
  system: 2,
  architecture: 2,
  "media lifecycle": 3,
  lifecycle: 3,
  emerging: 3,
  widget: 4,
  "add-on": 4,
  addon: 4,
  integration: 4,
  upload: 5,
  migrate: 5,
  asset: 5,
  transformation: 6,
  "media management": 7,
  management: 7,
  user: 8,
  role: 8,
  access: 8,
};

/**
 * Map a heading to a topic ID
 */
function mapHeadingToTopicId(heading: string): number | null {
  // Convert heading to lowercase for case-insensitive matching
  const lowerHeading = heading.toLowerCase();

  console.log(`Mapping heading: "${heading}" to topic ID`);

  // Try direct mapping first
  for (const [keyword, topicId] of Object.entries(topicKeywordMap)) {
    if (lowerHeading.includes(keyword)) {
      console.log(`  Match found: "${keyword}" -> Topic ID ${topicId}`);
      return topicId;
    }
  }

  console.log(`  No match found for heading: "${heading}"`);
  return null;
}

/**
 * Extract the main topic from a file based on its first heading
 */
function extractMainTopicFromFile(filePath: string): number | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    // Look for the first level 1 heading (# Topic)
    for (const line of lines) {
      if (line.startsWith("# ")) {
        const heading = line.substring(2).trim();
        return mapHeadingToTopicId(heading);
      }
    }

    return null;
  } catch (error) {
    console.error(`Error extracting main topic from ${filePath}:`, error);
    return null;
  }
}

/**
 * Parse markdown and assign topics to questions
 */
export function parseMarkdownWithTopics(filePath: string): any[] {
  // Parse questions using the existing parser
  const questions = parseMarkdownQuiz(filePath);

  // If no questions were found, try the alternative parser for quiz format
  if (questions.length === 0) {
    console.log(
      "No questions found with standard parser, trying alternative format parser..."
    );
    const alternativeQuestions = parseQuizFormat(filePath);

    if (alternativeQuestions.length > 0) {
      console.log(
        `Found ${alternativeQuestions.length} questions using alternative parser!`
      );

      // Get the main topic ID from the file name or first heading
      const mainTopicId = extractMainTopicFromFile(filePath);
      console.log(`Main topic ID for all questions: ${mainTopicId}`);

      // Assign the main topic ID to all questions
      return alternativeQuestions.map((q) => ({
        ...q,
        topicId: mainTopicId,
      }));
    }
  }

  // Determine if this is a single-topic or multi-topic file
  const content = fs.readFileSync(filePath, "utf-8");
  const mainTopicId = extractMainTopicFromFile(filePath);

  // Count level 2 headings that might indicate topic sections
  const sectionHeadings = content.match(/^## .+$/gm) || [];

  if (sectionHeadings.length <= 1) {
    // This appears to be a single-topic file
    console.log(
      `Single-topic file detected. Assigning Topic ID: ${mainTopicId}`
    );

    // Assign the main topic ID to all questions
    return questions.map((q) => ({
      ...q,
      topicId: mainTopicId,
    }));
  } else {
    // This is a multi-topic file with sections
    console.log(
      `Multi-topic file detected with ${sectionHeadings.length} sections`
    );

    // Extract sections with their topics
    const topicSections: { title: string; topicId: number | null }[] = [];
    for (const heading of sectionHeadings) {
      const title = heading.replace(/^## /, "").trim();
      const topicId = mapHeadingToTopicId(title);
      topicSections.push({ title, topicId });
    }

    // Print sections with their topics
    console.log("\nSections detected:");
    topicSections.forEach((section, i) => {
      console.log(
        `  ${i + 1}. "${section.title}" -> Topic ID: ${
          section.topicId || "Unknown"
        }`
      );
    });

    // Since most of these files have a predictable structure,
    // we'll assign topics based on the question number groups

    // Find content sections with questions
    // Filter out sections like "Instructions" that don't have questions
    const contentSections = topicSections.filter(
      (s) =>
        s.title !== "Instructions" &&
        !s.title.includes("Answers") &&
        s.topicId !== null
    );

    console.log(
      `\nContent sections for question grouping: ${contentSections.length}`
    );

    // Now assign questions to topics based on their position
    if (contentSections.length > 0) {
      const questionsPerSection = Math.ceil(
        questions.length / contentSections.length
      );
      console.log(`Questions per section (approx): ${questionsPerSection}`);

      const questionsWithTopics = questions.map((question, index) => {
        const sectionIndex = Math.floor(index / questionsPerSection);
        const section =
          contentSections[Math.min(sectionIndex, contentSections.length - 1)];

        return {
          ...question,
          topicId: section?.topicId || mainTopicId,
        };
      });

      // Print the question assignments
      console.log("\nQuestion topic assignments (sample):");
      for (let i = 0; i < Math.min(5, questionsWithTopics.length); i++) {
        console.log(
          `  Question ${i + 1}: Topic ID ${
            questionsWithTopics[i].topicId || "Unknown"
          }`
        );
      }

      return questionsWithTopics;
    }

    // Fallback - return questions with main topic
    return questions.map((q) => ({
      ...q,
      topicId: mainTopicId,
    }));
  }
}

/**
 * Parse a quiz format file
 * This format has questions with A), B), C), D), E) options on separate lines
 */
export function parseQuizFormat(filePath: string): any[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const questions: any[] = [];

  // Split the content into lines
  const lines = content.split("\n");

  let currentQuestion: {
    number: number;
    text: string;
    options: string[];
    correctIndex: number;
    correctIndices?: number[];
    hasMultipleCorrectAnswers?: boolean;
  } | null = null;

  let inQuestionsSection = false;
  let inAnswersSection = false;
  const answerMap = new Map<number, number[]>(); // Map question number to array of correct option indices
  const multiAnswerQuestionNumbers = new Set<number>(); // Track questions with multiple answers

  // Process the file line by line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect sections
    if (line === "## Questions") {
      inQuestionsSection = true;
      continue;
    } else if (line === "## Answers") {
      inQuestionsSection = false;
      inAnswersSection = true;
      continue;
    }

    // Skip empty lines
    if (line === "") continue;

    // Process answers section
    if (inAnswersSection) {
      // Simple match to get question number and answer text
      const answerLineMatch = line.match(/^(\d+)\.\s+(.*?)\s+-/);
      if (answerLineMatch) {
        const questionNum = parseInt(answerLineMatch[1], 10);
        const answerText = answerLineMatch[2].trim();

        // Extract all letters (A, B, C, etc.) from the answer text
        const correctIndices: number[] = [];
        const letterMatches = answerText.match(/[A-E]/g) || [];

        for (const letter of letterMatches) {
          const answerIndex = letter.charCodeAt(0) - 65; // A->0, B->1, etc.
          correctIndices.push(answerIndex);
        }

        // Store in answer map if we found any valid indices
        if (correctIndices.length > 0) {
          console.log(
            `Found ${
              correctIndices.length > 1 ? "multiple" : "single"
            } correct answer${
              correctIndices.length > 1 ? "s" : ""
            } for question ${questionNum}: ${letterMatches.join(", ")}`
          );
          answerMap.set(questionNum, correctIndices);

          // Mark questions with multiple answers
          if (correctIndices.length > 1) {
            multiAnswerQuestionNumbers.add(questionNum);
          }
        }
      }
      continue;
    }

    // Process questions section
    if (inQuestionsSection) {
      // Detect question start
      const questionMatch = line.match(/^\*\*(\d+)\.\s+(.*)\*\*$/);
      if (questionMatch) {
        // Save previous question if exists
        if (currentQuestion && currentQuestion.options.length > 0) {
          // Get correct answer indices
          const correctIndices = answerMap.get(currentQuestion.number) || [0];

          // Check if this is a multiple-choice question
          const hasMultipleCorrectAnswers = multiAnswerQuestionNumbers.has(
            currentQuestion.number
          );

          // Create explanation for multiple correct answers
          let explanation = "";
          if (hasMultipleCorrectAnswers) {
            const correctLetters = correctIndices
              .map((index) => String.fromCharCode(65 + index))
              .join(", ");
            explanation = `This question has multiple correct answers: ${correctLetters}`;
          }

          // Create array of correct answers for multiple-choice questions
          const correctAnswers = hasMultipleCorrectAnswers
            ? correctIndices.map((index) => currentQuestion?.options[index])
            : undefined;

          questions.push({
            number: currentQuestion.number,
            question: currentQuestion.text,
            options: currentQuestion.options,
            correctAnswerIndex: correctIndices[0], // Primary correct answer
            correctAnswerIndices: correctIndices, // All correct answers
            correctAnswers: correctAnswers, // Actual text of correct answers
            hasMultipleCorrectAnswers,
            explanation: explanation,
            topic: "Architecture",
            difficulty: "medium",
            source: "markdown",
          });
        }

        // Check if question text contains "select all that apply" indicator
        const questionText = questionMatch[2];
        const isMultipleChoice =
          questionText.toLowerCase().includes("select all that apply") ||
          questionText.toLowerCase().includes("select all");

        // Start new question
        currentQuestion = {
          number: parseInt(questionMatch[1], 10),
          text: questionMatch[2],
          options: [],
          correctIndex: 0,
          hasMultipleCorrectAnswers: isMultipleChoice, // Pre-set based on question text
        };
        continue;
      }

      // Detect option lines - looking for A), B), C), etc.
      if (currentQuestion) {
        // Try the standard format: "A) Option text"
        const optionMatch = line.match(/^([A-E])\)\s+(.*)$/);
        if (optionMatch) {
          const optionText = optionMatch[2].trim();
          currentQuestion.options.push(optionText);
          continue;
        }

        // Try multi-line option continuation (indented text belonging to the last option)
        if (line.startsWith("   ") && currentQuestion.options.length > 0) {
          // Append to the last option
          const lastIndex = currentQuestion.options.length - 1;
          currentQuestion.options[lastIndex] += " " + line.trim();
        }
      }
    }
  }

  // Add the last question
  if (currentQuestion && currentQuestion.options.length > 0) {
    // Get correct answer indices
    const correctIndices = answerMap.get(currentQuestion.number) || [0];

    // Check if this is a multiple-choice question
    const hasMultipleCorrectAnswers = multiAnswerQuestionNumbers.has(
      currentQuestion.number
    );

    // Create explanation for multiple correct answers
    let explanation = "";
    if (hasMultipleCorrectAnswers) {
      const correctLetters = correctIndices
        .map((index) => String.fromCharCode(65 + index))
        .join(", ");
      explanation = `This question has multiple correct answers: ${correctLetters}`;
    }

    // Create array of correct answers for multiple-choice questions
    const correctAnswers = hasMultipleCorrectAnswers
      ? correctIndices.map((index) => currentQuestion?.options[index])
      : undefined;

    questions.push({
      number: currentQuestion.number,
      question: currentQuestion.text,
      options: currentQuestion.options,
      correctAnswerIndex: correctIndices[0], // Primary correct answer
      correctAnswerIndices: correctIndices, // All correct answers
      correctAnswers: correctAnswers, // Actual text of correct answers
      hasMultipleCorrectAnswers,
      explanation: explanation,
      topic: "Architecture",
      difficulty: "medium",
      source: "markdown",
    });
  }

  // Count questions with multiple correct answers
  const multipleAnswerQuestions = questions.filter(
    (q) => q.hasMultipleCorrectAnswers
  ).length;

  // Fix any multi-answer questions where the flag wasn't set correctly
  for (const q of questions) {
    if (
      multiAnswerQuestionNumbers.has(q.number) &&
      !q.hasMultipleCorrectAnswers
    ) {
      q.hasMultipleCorrectAnswers = true;

      // Ensure explanation is set
      const correctIndices = answerMap.get(q.number) || [0];
      if (correctIndices.length > 1) {
        const correctLetters = correctIndices
          .map((index) => String.fromCharCode(65 + index))
          .join(", ");
        q.explanation = `This question has multiple correct answers: ${correctLetters}`;

        // Also set correctAnswers array
        q.correctAnswers = correctIndices.map((index) => q.options[index]);
      }
    }
  }

  // Get final count of multiple-answer questions
  const finalMultipleAnswerQuestions = questions.filter(
    (q) => q.hasMultipleCorrectAnswers
  ).length;

  console.log(
    `Found ${questions.length} questions with ${questions.reduce(
      (sum: number, q: any) => sum + q.options.length,
      0
    )} total options (${finalMultipleAnswerQuestions} questions have multiple correct answers)`
  );

  return questions;
}

/**
 * Test parsing a single markdown file
 */
async function testParseFile(filePath: string): Promise<void> {
  console.log(`\n🧪 Testing parser with file: ${filePath}`);

  try {
    // Parse the file with topic assignment
    console.log("\n📝 Parsing file with topic assignment...");
    const questionsWithTopics = parseMarkdownWithTopics(filePath);

    console.log(
      `\n✅ Found ${questionsWithTopics.length} questions in the file`
    );

    // Print a summary of the questions
    console.log("\n📋 Summary of parsed questions:");
    console.log("---------------------------");
    console.log("# | TopicID | Options | Answer | Question Preview");
    console.log("---------------------------");

    for (let i = 0; i < questionsWithTopics.length; i++) {
      const q = questionsWithTopics[i];

      // Get the answer letter
      const answerLetter = String.fromCharCode(65 + q.correctAnswerIndex);

      // Get a short snippet of the question text
      const textSnippet =
        q.question.substring(0, 40).replace(/\n/g, " ") + "...";

      console.log(
        `${(i + 1).toString().padStart(2)} | ${(q.topicId || "?")
          .toString()
          .padStart(7)} | ${q.options.length
          .toString()
          .padStart(7)} | ${answerLetter.padStart(6)} | ${textSnippet}`
      );
    }
    console.log("---------------------------");

    // Check if all questions have exactly 4 options
    const validOptions = questionsWithTopics.every(
      (q) => q.options.length >= 2 && q.options.length <= 5
    );
    if (validOptions) {
      console.log("\n✅ All questions have between 2-5 options");
    } else {
      console.log(
        "\n⚠️ Warning: Some questions have fewer than 2 or more than 5 options"
      );
      for (let i = 0; i < questionsWithTopics.length; i++) {
        const q = questionsWithTopics[i];
        if (q.options.length < 2 || q.options.length > 5) {
          console.log(`- Question ${i + 1}: ${q.options.length} options`);
        }
      }
    }

    // Ask if the user wants to seed the database
    const proceed = await askForConfirmation(
      "\nDo you want to clean and seed the database with this file?"
    );

    if (proceed) {
      // Clean and seed the database
      console.log("\n🧹 Cleaning database...");
      await cleanDatabase(true); // Silent mode
      console.log("✅ Database cleaned");

      console.log("\n🌱 Seeding database with parsed questions...");
      await seedQuiz(filePath, false);
      console.log("✅ Database seeded successfully");
    } else {
      console.log("❌ Database operations skipped");
    }

    console.log("\n✅ Test completed");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

/**
 * Ask for confirmation from the user
 */
async function askForConfirmation(message: string): Promise<boolean> {
  process.stdout.write(`${message} (y/n): `);

  return new Promise((resolve) => {
    process.stdin.once("data", (data) => {
      const response = data.toString().trim().toLowerCase();
      resolve(response === "y" || response === "yes");
    });
  });
}

// Add this function to print detailed output for specific questions
function printDetailedQuestionData(questions: any) {
  console.log("\n🔍 DETAILED OUTPUT FOR PROBLEMATIC QUESTIONS:\n");

  // Focus on questions 5 and 7 which have code blocks in options
  const problematicQuestionNumbers = [5, 7];

  for (const questionNumber of problematicQuestionNumbers) {
    const question = questions.find((q: any) => q.number === questionNumber);

    if (!question) {
      console.log(`❌ Question #${questionNumber} not found in parsed data`);
      continue;
    }

    console.log(`\n=== QUESTION #${questionNumber} ===`);
    console.log(`Question text: ${question.text}`);
    console.log("\nOptions:");

    question.options.forEach((option: any) => {
      console.log(
        `\n- ${option.letter.toUpperCase()}) [${
          option.isCorrect ? "CORRECT" : "INCORRECT"
        }]`
      );
      console.log(
        `Content: ${option.content.substring(0, 80)}${
          option.content.length > 80 ? "..." : ""
        }`
      );
    });

    console.log("\n----------------------------");
  }
}

// Main execution
async function main(): Promise<void> {
  if (process.argv.length > 2) {
    // Use the file path provided as an argument
    const filePath = path.resolve(process.argv[2]);
    await testParseFile(filePath);
  } else {
    // Use the default test file
    const filePath = path.join(__dirname, "cloudinary-quiz-2.md");
    await testParseFile(filePath);
  }

  // Add this after your existing test code
  console.log("\n🧪 Testing with full quiz file...");
  const fullQuizPath = path.join(__dirname, "cloudinary-quiz-2.md");
  const fullQuizMarkdown = fs.readFileSync(fullQuizPath, "utf-8");
  const fullQuizQuestions = parseQuizMarkdown(fullQuizMarkdown);

  // Print detailed info for questions 5 and 7
  console.log("\n🔍 DETAILED OUTPUT FOR PROBLEMATIC QUESTIONS (FULL QUIZ):\n");
  [5, 7].forEach((num) => {
    const q = fullQuizQuestions.find((q: any) => q.number === num);
    if (!q) {
      console.log(`❌ Question #${num} not found in full quiz`);
      return;
    }

    console.log(`\n=== QUESTION #${num} ===`);
    console.log(`Question text: ${q.text}`);
    console.log("\nOptions:");

    q.options.forEach((opt: any) => {
      console.log(
        `\n- ${opt.letter.toUpperCase()}) [${
          opt.isCorrect ? "CORRECT" : "INCORRECT"
        }]`
      );
      // Print full content to see exactly what's being parsed
      console.log("Content:");
      console.log("---");
      console.log(opt.content);
      console.log("---");
    });

    console.log("\n----------------------------");
  });

  console.log("\n✅ Full quiz test completed");

  process.exit(0);
}

// Run the script
main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});

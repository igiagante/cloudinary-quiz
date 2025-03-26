/**
 * Module for checking and reporting on questions in the database
 * This file can also be run directly as a script
 *
 * Usage:
 * POSTGRES_URL=<your_db_url> npx tsx lib/db/scripts/modules/check-questions.ts
 */

import path from "path";
import { config } from "dotenv";
import { eq, like, or } from "drizzle-orm";
// @ts-ignore
import chalk from "chalk";
// @ts-ignore
import * as figlet from "figlet";
import { db, schema } from "./db";

// Type definition for a question from the database
type QuestionRecord = {
  id: string;
  uuid: string | null;
  question: string;
  options: string[];
  correctAnswer: string | null;
  explanation: string | null;
  topic: string;
  difficulty: string;
  source: string | null;
  qualityScore: number | null;
  usageCount: number | null;
  successRate: number | null;
  feedbackCount: number | null;
  positiveRatings: number | null;
  hasMultipleCorrectAnswers: boolean | null;
  correctAnswers: string[] | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

// Type-safe database reference
// Using type assertion to help TypeScript understand our runtime check
const database = db as any;

// Official Cloudinary exam topics
const OFFICIAL_TOPICS = [
  "Products, Value, Environment Settings, and Implementation Strategies",
  "System Architecture",
  "Media Lifecycle Strategy and Emerging Trends",
  "Widgets, Out of Box Add-ons, Custom Integrations",
  "Upload and Migrate Assets",
  "Transformations",
  "Media Management",
  "User, Role, and Group Management and Access Controls",
];

// Load environment variables from .env.local
config({
  path: path.resolve(process.cwd(), ".env.local"),
});

// Main function to check questions in the database
export async function checkQuestions() {
  try {
    // Check if database connection is available
    if (!database) {
      console.error(chalk.red("Database connection is not available"));
      if (require.main === module) process.exit(1);
      return false;
    }

    // Display a fancy title
    console.log(
      chalk.cyan(
        figlet.textSync("Quiz Statistics", {
          font: "Standard",
          horizontalLayout: "default",
          verticalLayout: "default",
        })
      )
    );

    // Report questions grouped by topic
    await reportQuestionsByTopic();

    console.log(chalk.yellow("============================================="));
    console.log(chalk.green("✅ Report completed"));

    return true;
  } catch (error) {
    console.error(chalk.red("❌ An error occurred:"));
    console.error(error);
    return false;
  }
}

// Helper function to display questions
function displayQuestions(
  matchingQuestions: QuestionRecord[],
  description: string
) {
  if (matchingQuestions.length === 0) {
    console.log(chalk.yellow(`No questions found matching: ${description}`));
    return;
  }

  // Display each matching question
  matchingQuestions.forEach((question, index) => {
    console.log(
      chalk.green(
        `\nFound Question ${index + 1}: ${question.question.substring(
          0,
          80
        )}...`
      )
    );
    console.log(chalk.yellow("Options:"));

    if (!question.options) {
      console.log(chalk.red("  No options found in the database!"));
    } else if (typeof question.options === "string") {
      console.log(chalk.red("  Options stored as string instead of array!"));
      console.log(`  ${question.options}`);
    } else {
      // Display options from JSONB field
      const optionsArray = question.options as string[];
      optionsArray.forEach((option, idx) => {
        console.log(
          chalk.blue(`  ${String.fromCharCode(65 + idx)}) ${option}`)
        );
      });
    }

    // Highlight issues
    const optionsArray = Array.isArray(question.options)
      ? question.options
      : [];
    const issues = optionsArray.filter(
      (opt: string) =>
        typeof opt === "string" &&
        (opt.includes("**Difficulty") ||
          opt.includes("\n\n") ||
          opt.match(/\n\s*\n/))
    );

    if (issues.length > 0) {
      console.log(chalk.red("\nPotential issues found:"));
      issues.forEach((issue: string, idx: number) => {
        console.log(chalk.red(`  Issue ${idx + 1}: ${issue}`));
      });
    } else {
      console.log(chalk.green("\n✅ No issues found with options"));
    }
  });
}

// Function to report questions grouped by topic
async function reportQuestionsByTopic() {
  try {
    // Get all questions
    const allQuestions = (await database
      .select()
      .from(schema.questions)) as QuestionRecord[];

    // Group questions by topic
    const questionsByTopic: Record<string, QuestionRecord[]> = {};

    allQuestions.forEach((question: QuestionRecord) => {
      const topic = question.topic || "Uncategorized";

      if (!questionsByTopic[topic]) {
        questionsByTopic[topic] = [];
      }

      questionsByTopic[topic].push(question);
    });

    // Display statistics
    console.log(
      chalk.cyan("\n📝 Total Questions: ") + chalk.green(allQuestions.length)
    );

    // Display questions by topic (simplified version)
    console.log(chalk.yellow("\nQuestions by topic:"));

    // Sort topics alphabetically
    const sortedTopics = Object.entries(questionsByTopic).sort(
      ([topicA], [topicB]) => topicA.localeCompare(topicB)
    );

    // Display each topic with count
    for (const [topic, topicQuestions] of sortedTopics) {
      console.log(
        chalk.cyan(`— ${topic}: `) + chalk.green(`${topicQuestions.length}`)
      );
    }

    // Show official exam topics
    console.log(chalk.yellow("\nOfficial Cloudinary Exam Topics:"));
    OFFICIAL_TOPICS.forEach((topic) => {
      if (questionsByTopic[topic]) {
        // We have questions for this topic
        console.log(
          chalk.green(`✓ ${topic}: `) +
            chalk.cyan(`${questionsByTopic[topic].length} questions`)
        );
      } else {
        // No questions for this topic yet
        console.log(
          chalk.red(`✗ ${topic}: `) + chalk.yellow("No questions available")
        );
      }
    });

    // Check for topics in our database that aren't in the official list
    const unofficialTopics = Object.keys(questionsByTopic).filter(
      (topic) => !OFFICIAL_TOPICS.includes(topic)
    );

    if (unofficialTopics.length > 0) {
      console.log(chalk.yellow("\nUnofficial Topics:"));
      unofficialTopics.forEach((topic) => {
        console.log(
          chalk.gray(`? ${topic}: `) +
            chalk.cyan(`${questionsByTopic[topic].length} questions`)
        );
      });
    }
  } catch (error) {
    console.error(chalk.red("Error generating topic report:"), error);
  }
}

// Run this module directly if it's called as a script
if (require.main === module) {
  console.log(chalk.yellow("Running as standalone script"));
  checkQuestions()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Unhandled error:", error);
      process.exit(1);
    });
}

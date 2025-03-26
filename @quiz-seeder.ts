/**
 * @quiz-seeder.ts
 * Main entry point for quiz seeding operations
 * This file handles seeding quizzes and reporting on the database
 */

import { runQuizSeeder } from "./lib/db/scripts/modules/quiz-seeder";
import { checkQuestions } from "./lib/db/scripts/modules/check-questions";

// Process command line arguments
const args = process.argv.slice(2);
const shouldCheckOnly = args.includes("--check-only");

// Main async function
async function main() {
  try {
    // If --check-only flag is provided, only run the check questions function
    if (shouldCheckOnly) {
      await checkQuestions();
    } else {
      // Otherwise run the full quiz seeder
      await runQuizSeeder();
    }

    // Exit cleanly
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Run main function
main();

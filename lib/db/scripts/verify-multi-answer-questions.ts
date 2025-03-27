// Script to verify that multiple-answer questions are correctly structured in the database
import { db } from "../index";
import { questions, options } from "../schema";
import { like } from "drizzle-orm";

// Define the option type
interface Option {
  id: number;
  text: string;
  isCorrect: boolean;
}

// Define the question type with options
interface QuestionWithOptions {
  id: string;
  uuid: string;
  question: string;
  hasMultipleCorrectAnswers?: boolean;
  options: Option[];
}

async function verifyMultiAnswerQuestions() {
  console.log("Verifying multiple-answer questions in the database...");

  // Find questions that should have multiple answers
  const multipleAnswerQuestions = await db.query.questions.findMany({
    where: like(questions.question, "%(Select%apply)%"),
    with: {
      options: true,
    },
  });

  console.log(
    `\nFound ${multipleAnswerQuestions.length} questions with "(Select...apply)" in title`
  );

  // Analyze each question
  let correctlyStructuredCount = 0;
  let problemsCount = 0;

  for (const q of multipleAnswerQuestions) {
    // For detailed analysis of each question
    const correctOptionsCount = q.options.filter(
      (o: Option) => o.isCorrect
    ).length;
    const title =
      q.question.substring(0, 50) + (q.question.length > 50 ? "..." : "");

    console.log(`\nQuestion: "${title}"`);
    console.log(`- ID: ${q.uuid}`);
    console.log(
      `- hasMultipleCorrectAnswers flag: ${q.hasMultipleCorrectAnswers}`
    );
    console.log(`- Number of correct options: ${correctOptionsCount}`);

    // Check if question is correctly structured
    const isCorrectlyStructured =
      q.hasMultipleCorrectAnswers === true && correctOptionsCount > 1;

    if (isCorrectlyStructured) {
      console.log("✅ This question is correctly structured");
      correctlyStructuredCount++;
    } else {
      console.log("❌ This question has problems:");
      if (!q.hasMultipleCorrectAnswers) {
        console.log("  - hasMultipleCorrectAnswers flag is not set to true");
      }
      if (correctOptionsCount <= 1) {
        console.log(`  - Only has ${correctOptionsCount} correct option(s)`);
      }
      problemsCount++;
    }

    // List all options for debugging
    console.log("- Options:");
    q.options.forEach((o: Option, i: number) => {
      const letter = String.fromCharCode(65 + i); // A, B, C, etc.
      console.log(
        `  ${letter}) ${o.text.substring(0, 30)}... [${
          o.isCorrect ? "CORRECT" : "incorrect"
        }]`
      );
    });
  }

  // Summary
  console.log("\n=== Summary ===");
  console.log(
    `Total multiple-answer questions: ${multipleAnswerQuestions.length}`
  );
  console.log(`Correctly structured: ${correctlyStructuredCount}`);
  console.log(`Problems found: ${problemsCount}`);
}

// Run the verification
verifyMultiAnswerQuestions()
  .then(() => {
    console.log("\nVerification completed successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  });

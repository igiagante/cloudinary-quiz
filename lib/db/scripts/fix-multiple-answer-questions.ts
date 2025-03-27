// Script to fix multiple-answer questions in the database
import { db } from "../index";
import { questions, options } from "../schema";
import { eq, like } from "drizzle-orm";
import fs from "fs";
import path from "path";

// Helper function to extract answer key information from quiz files
function extractAnswerKeys(quizContent: string) {
  const answerKeyMatch = quizContent.match(/## Answers([\s\S]+)$/);
  if (!answerKeyMatch) return {};

  const answerKeySection = answerKeyMatch[1];
  const answerLines = answerKeySection
    .split("\n")
    .filter((line) => line.trim().length > 0);

  const questionAnswers: Record<number, string[]> = {};

  for (const line of answerLines) {
    // Look for patterns like "9. A, B, C, D, E - Cloudinary supports..."
    const match = line.match(/^(\d+)\.\s+([A-E,\s]+)\s*-\s*/);
    if (match) {
      const questionNumber = parseInt(match[1], 10);
      const answers = match[2].split(",").map((a) => a.trim());

      // If more than one answer, it's a multiple-answer question
      if (answers.length > 1) {
        questionAnswers[questionNumber] = answers;
      }
    }
  }

  return questionAnswers;
}

// Main function to fix multiple-answer questions
async function fixMultipleAnswerQuestions() {
  console.log("Starting to fix multiple-answer questions...");

  // First, find all questions that have text indicating multiple answers
  const multipleAnswerQuestions = await db.query.questions.findMany({
    where: like(questions.question, "%(Select all that apply)%"),
    with: {
      options: true,
    },
  });

  console.log(
    `Found ${multipleAnswerQuestions.length} questions with "(Select all that apply)" in title`
  );

  // Read quiz files to extract answer keys
  const quizDir = path.join(process.cwd(), "quizzes");
  const quizFiles = fs
    .readdirSync(quizDir)
    .filter((file) => file.endsWith(".md"));

  const allAnswerKeys: Record<string, Record<number, string[]>> = {};

  for (const file of quizFiles) {
    const filePath = path.join(quizDir, file);
    const content = fs.readFileSync(filePath, "utf8");
    const answerKeys = extractAnswerKeys(content);
    const fileKey = file.replace(".md", "");
    allAnswerKeys[fileKey] = answerKeys;
  }

  console.log(
    "Extracted answer keys from quiz files:",
    Object.entries(allAnswerKeys).map(
      ([file, keys]) => `${file}: ${Object.keys(keys).length} questions`
    )
  );

  // Update questions and options in the database
  let updatedCount = 0;
  let errorsCount = 0;

  for (const q of multipleAnswerQuestions) {
    try {
      // Set hasMultipleCorrectAnswers to true
      await db
        .update(questions)
        .set({
          hasMultipleCorrectAnswers: true,
          updatedAt: new Date(),
        })
        .where(eq(questions.id, q.id));

      // Check if we can use question number to get answers from the answer key
      const questionNumber = extractQuestionNumber(q.question);

      if (questionNumber) {
        // Look for this question in all quiz files' answer keys
        let correctOptions: string[] = [];

        for (const [_, answerKeys] of Object.entries(allAnswerKeys)) {
          if (
            answerKeys[questionNumber] &&
            answerKeys[questionNumber].length > 1
          ) {
            correctOptions = answerKeys[questionNumber];
            break;
          }
        }

        if (correctOptions.length > 1) {
          console.log(
            `Updating question #${questionNumber}: "${q.question.substring(
              0,
              40
            )}..."`,
            `Setting correct options: ${correctOptions.join(", ")}`
          );

          // Update all options for this question
          for (const option of q.options) {
            // Get the option letter (A, B, C, etc.) from the option text
            const optionLetter = option.text.match(/^([A-E])\)/)?.[1];

            if (optionLetter) {
              const isCorrect = correctOptions.includes(optionLetter);

              await db
                .update(options)
                .set({
                  isCorrect,
                })
                .where(eq(options.id, option.id));
            }
          }

          updatedCount++;
        } else {
          console.log(
            `Could not find answer key for question #${questionNumber}:`,
            q.question.substring(0, 40)
          );
          errorsCount++;
        }
      } else {
        console.log(
          "Could not extract question number from:",
          q.question.substring(0, 40)
        );
        errorsCount++;
      }
    } catch (err) {
      console.error(`Error updating question ${q.id}:`, err);
      errorsCount++;
    }
  }

  console.log(
    `Completed! Updated ${updatedCount} questions. Errors: ${errorsCount}`
  );
}

// Helper to extract question number from the question text
function extractQuestionNumber(questionText: string): number | null {
  // Look for patterns like "9. Which of these asset types..." or "**9. Which of these asset..."
  const match = questionText.match(/^(?:\*\*)?(\d+)\.(?:\*\*)?\s+/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

// Run the script
fixMultipleAnswerQuestions()
  .then(() => {
    console.log("Script completed successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Script failed:", err);
    process.exit(1);
  });

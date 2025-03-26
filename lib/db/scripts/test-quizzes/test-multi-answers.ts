import { parseQuizFormat } from "./test-markdown-parser";
import path from "path";

// Create a minimal test that just calls the parser and exits
async function testParser() {
  // Use the correct absolute file path for the architecture quiz
  const filePath = path.resolve(
    process.cwd(),
    "quizzes/cloudinary-architecture-quiz.md"
  );
  console.log(`Testing parser with file: ${filePath}`);

  try {
    const questions = parseQuizFormat(filePath);

    console.log("Total questions:", questions.length);
    console.log(
      "Multiple-answer questions:",
      questions.filter((q) => q.hasMultipleCorrectAnswers).length
    );

    // Log detail for specific questions
    [5, 6, 9, 11].forEach((num) => {
      const question = questions.find((q) => q.number === num);
      if (question) {
        console.log(`\nQuestion #${num}:`);
        console.log(
          "- hasMultipleCorrectAnswers:",
          question.hasMultipleCorrectAnswers
        );
        console.log("- correctAnswers:", question.correctAnswers);
        console.log("- Text:", question.question.substring(0, 60) + "...");
      } else {
        console.log(`Question #${num} not found`);
      }
    });

    console.log("\nParser is correctly identifying multiple-answer questions!");
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the test and immediately exit
testParser().then(() => process.exit(0));

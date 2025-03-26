import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { parseQuizDocument } from "../../parser/quiz-parser";
import {
  ParsedQuestion,
  parseMarkdownQuiz,
} from "../../parser/quiz-markdown-parser";
import { db, schema } from "./db";
import { log, getTopic } from "./utils";
import { cleanDatabase } from "./clean";
import { seedTopics } from "./topic-manager";
import { createTestUser } from "./user-manager";

/**
 * Insert a question from the parser format to the database
 */
export async function insertNewQuestionToDatabase(q: ParsedQuestion) {
  const topicValue = q.topic || "Cloudinary"; // Use parsed topic or default
  const difficultyValue = q.difficulty || "medium";
  const questionId = uuidv4();

  // Format options for the JSONB field
  const optionsArray = q.options;

  // Get correct answer
  const correctAnswer = q.options[q.correctAnswerIndex] || "";

  // Insert the question
  const [questionResult] = await db
    .insert(schema.questions)
    .values({
      id: questionId,
      uuid: uuidv4(),
      question: q.question,
      options: optionsArray as any, // JSONB field for options array
      correctAnswer: correctAnswer,
      explanation:
        q.explanation || "The correct answer is the most appropriate option.",
      topic: topicValue,
      difficulty: difficultyValue,
      source: q.source || "markdown",
      qualityScore: 80,
      usageCount: 0,
      successRate: 0,
      feedbackCount: 0,
      positiveRatings: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  // Insert the options
  for (let i = 0; i < q.options.length; i++) {
    await db.insert(schema.options).values({
      questionId: questionResult.id,
      text: q.options[i],
      isCorrect: i === q.correctAnswerIndex,
      createdAt: new Date(),
    });
  }

  return questionResult;
}

/**
 * Display a summary of parsed questions for verification
 */
export function displayQuestionsSummary(questions: ParsedQuestion[]): void {
  log("\n📋 Summary of parsed questions:", "bright");
  log("---------------------------");
  log("# | Topic | Options | Answer | MultiAns | Question Preview");
  log("---------------------------");

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    // Get the answer letter(s)
    let answerLetters = String.fromCharCode(65 + q.correctAnswerIndex);
    if (q.hasMultipleCorrectAnswers && q.correctAnswerIndices) {
      answerLetters = q.correctAnswerIndices
        .map((idx: number) => String.fromCharCode(65 + idx))
        .join(",");
    }

    // Get a short snippet of the question text
    const textSnippet = q.question.substring(0, 30).replace(/\n/g, " ") + "...";

    // Map topicId to topic name if needed
    const topicDisplay =
      q.topic || (q.topicId ? getTopic(q.topicId) : "Unknown");

    log(
      `${(i + 1).toString().padStart(2)} | ${topicDisplay
        .substring(0, 5)
        .padStart(5)} | ${q.options.length
        .toString()
        .padStart(7)} | ${answerLetters.padStart(6)} | ${
        q.hasMultipleCorrectAnswers ? "Yes" : "No"
      } | ${textSnippet}`
    );
  }
  log("---------------------------");
}

/**
 * Database seeding function that handles markdown sources
 * and initializes topics and users
 * @param sourcePath Path to the source file or directory
 * @param cleanFirst Whether to clean the database before seeding
 */
export async function seedDatabase(
  sourcePath: string,
  cleanFirst: boolean = false
): Promise<void> {
  try {
    log(`Starting comprehensive database seeding process`, "cyan");

    // Add overall timing
    const totalStartTime = Date.now();

    // Clean the database if requested
    if (cleanFirst) {
      log("Cleaning database before seeding...", "blue");
      await cleanDatabase(true); // Silent mode
      log("✓ Database cleaned", "green");
    }

    // Step 1: Seed topics
    log("Seeding topics...", "blue");
    await seedTopics();
    log("✓ Topics seeded successfully", "green");

    // Step 2: Create test user
    log("Creating test user...", "blue");
    await createTestUser();
    log("✓ Test user created successfully", "green");

    // Step 3: Process markdown source
    log(`Seeding questions from markdown source: ${sourcePath}`, "blue");

    // Process markdown source
    let directoryPath = sourcePath;

    // Check if the source is a file or directory
    const isDirectory = fs.lstatSync(sourcePath).isDirectory();

    if (isDirectory) {
      // Process all markdown files in the directory
      const files = fs
        .readdirSync(directoryPath)
        .filter((file) => file.endsWith(".md"))
        .map((file) => path.join(directoryPath, file));

      log(`Found ${files.length} markdown files to process`, "blue");

      let totalQuestions = 0;
      let totalSuccessCount = 0;
      let totalErrorCount = 0;

      // Process each file separately
      for (const filePath of files) {
        log(`Processing file: ${path.basename(filePath)}`, "blue");

        // Add file timing
        const fileStartTime = Date.now();

        // Parse the markdown file
        const questions = parseMarkdownQuiz(filePath);
        log(`  - Parsed ${questions.length} questions`, "blue");

        totalQuestions += questions.length;

        // Seed the database with the parsed questions
        let successCount = 0;
        let errorCount = 0;

        for (const q of questions) {
          try {
            await insertNewQuestionToDatabase(q);
            successCount++;
          } catch (error) {
            log(
              `  ✗ Error inserting question: ${q.question.substring(0, 50)}...`,
              "red"
            );
            console.error(error);
            errorCount++;
          }
        }

        const fileEndTime = Date.now();
        const fileDuration = ((fileEndTime - fileStartTime) / 1000).toFixed(2);

        log(
          `  ✓ Successfully inserted ${successCount} questions from ${path.basename(
            filePath
          )} in ${fileDuration}s`,
          "green"
        );
        if (errorCount > 0) {
          log(
            `  ✗ Failed to insert ${errorCount} questions from ${path.basename(
              filePath
            )}`,
            "yellow"
          );
        }

        totalSuccessCount += successCount;
        totalErrorCount += errorCount;
      }

      log(`\n📊 Summary:`, "bright");
      log(
        `Processed ${files.length} files with ${totalQuestions} total questions`,
        "green"
      );
      log(
        `Successfully inserted ${totalSuccessCount} questions to database`,
        "green"
      );

      if (totalErrorCount > 0) {
        log(`Failed to insert ${totalErrorCount} questions`, "yellow");
      }

      // Also add total time for markdown seeding
      const totalEndTime = Date.now();
      const totalDuration = ((totalEndTime - totalStartTime) / 1000).toFixed(2);
      log(`Total seeding time: ${totalDuration}s`, "bright");
    } else {
      // Process a single markdown file
      log(`Parsing and seeding from single file: ${sourcePath}`, "blue");

      // Add file timing
      const fileStartTime = Date.now();

      // Use the standard parser
      const questions = parseMarkdownQuiz(sourcePath);

      log(`Parsed ${questions.length} questions from ${sourcePath}`, "blue");

      // Validate that questions have between 2 and 5 options
      const invalidQuestions = questions.filter(
        (q: any) => q.options.length < 2 || q.options.length > 5
      );
      if (invalidQuestions.length > 0) {
        log(
          `⚠️ Warning: ${invalidQuestions.length} questions have fewer than 2 or more than 5 options`,
          "yellow"
        );
      }

      // Map the questions to ParsedQuestion format
      const parsedQuestions: ParsedQuestion[] = questions.map((q: any) => ({
        question: q.question,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        correctAnswerIndices: q.correctAnswerIndices,
        hasMultipleCorrectAnswers: q.hasMultipleCorrectAnswers,
        explanation: q.explanation || "",
        topic: getTopic(q.topicId),
        topicId: q.topicId,
        difficulty: q.difficulty as any,
        source: q.source,
      }));

      // Seed the database with the parsed questions
      let successCount = 0;
      let errorCount = 0;

      for (const q of parsedQuestions) {
        try {
          await insertNewQuestionToDatabase(q);
          successCount++;
        } catch (error) {
          log(
            `✗ Error inserting question: ${q.question.substring(0, 50)}...`,
            "red"
          );
          console.error(error);
          errorCount++;
        }
      }

      const fileEndTime = Date.now();
      const fileDuration = ((fileEndTime - fileStartTime) / 1000).toFixed(2);

      log(
        `✓ Successfully inserted ${successCount} questions from markdown file in ${fileDuration}s`,
        "green"
      );
      if (errorCount > 0) {
        log(
          `✗ Failed to insert ${errorCount} questions from markdown file`,
          "yellow"
        );
      }

      // Add total time for markdown seeding
      const totalEndTime = Date.now();
      const totalDuration = ((totalEndTime - totalStartTime) / 1000).toFixed(2);
      log(`Total seeding time: ${totalDuration}s`, "bright");
    }

    log(`✓ Database seeding completed successfully`, "green");
  } catch (error) {
    log(`✗ Error seeding database:`, "red");
    console.error(error);
    throw error;
  }
}

/**
 * Parse and seed a quiz from markdown file
 * @param filePath Path to the markdown file
 * @param cleanFirst Whether to clean relevant topic data before seeding
 * @param topicId Optional specific topic ID for the quiz questions
 */
export async function seedQuiz(
  filePath: string,
  cleanFirst: boolean = false,
  topicId?: number
): Promise<void> {
  try {
    log(`Starting database seeding for quiz: ${filePath}`, "cyan");

    // Add overall timing
    const totalStartTime = Date.now();

    // Parse the quiz file
    log(`Parsing quiz file: ${filePath}`, "blue");
    const questions = parseQuizDocument(filePath, {
      isFilePath: true,
    });

    // If topicId is provided, override the parsed topicId
    if (topicId) {
      questions.forEach((q) => (q.topicId = topicId));
    }

    // Clean the database for the specific topic if requested
    if (cleanFirst) {
      // Use the first question's topic ID if not explicitly provided
      const cleanTopicId =
        topicId || (questions.length > 0 ? questions[0].topicId : undefined);

      if (cleanTopicId) {
        log(
          `Cleaning database for topic ID ${cleanTopicId} before seeding...`,
          "blue"
        );
        await cleanDatabase(false, cleanTopicId); // Use our existing function
        log("✅ Topic data cleaned", "green");
      } else {
        log("Cleaning database before seeding...", "blue");
        await cleanDatabase(true); // Silent mode, clean everything
        log("✅ Database cleaned", "green");
      }
    }

    // Map the questions to ParsedQuestion format
    const parsedQuestions: ParsedQuestion[] = questions.map((q: any) => ({
      question: q.question,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex,
      correctAnswerIndices: q.correctAnswerIndices,
      hasMultipleCorrectAnswers: q.hasMultipleCorrectAnswers,
      explanation: q.explanation || "",
      topic: getTopic(q.topicId),
      topicId: q.topicId,
      difficulty: q.difficulty as any,
      source: q.source,
    }));

    log(`Parsed ${parsedQuestions.length} questions from quiz`, "blue");

    // Display summary of parsed questions for verification
    displayQuestionsSummary(parsedQuestions);

    // Seed the database with the parsed questions
    let successCount = 0;
    let errorCount = 0;

    for (const q of parsedQuestions) {
      try {
        await insertNewQuestionToDatabase(q);
        successCount++;
      } catch (error) {
        log(
          `✗ Error inserting question: ${q.question.substring(0, 50)}...`,
          "red"
        );
        console.error(error);
        errorCount++;
      }
    }

    const totalEndTime = Date.now();
    const totalDuration = ((totalEndTime - totalStartTime) / 1000).toFixed(2);

    log(
      `✓ Successfully inserted ${successCount} questions from quiz in ${totalDuration}s`,
      "green"
    );
    if (errorCount > 0) {
      log(`✗ Failed to insert ${errorCount} questions from quiz`, "yellow");
    }

    log(`✓ Quiz seeding completed successfully`, "green");
  } catch (error) {
    log(`✗ Error seeding quiz:`, "red");
    console.error(error);
    throw error;
  }
}

/**
 * Run the complete workflow: clean → seed
 */
export async function runWorkflow(): Promise<void> {
  try {
    log("Starting Comprehensive Database Setup Workflow", "cyan");

    // Step 1: Clean the database
    log("\n1. Cleaning the database", "bright");
    await cleanDatabase();

    // Step 2: Seed all required data (topics, users, questions)
    log("\n2. Seeding the database (topics, users, and questions)", "bright");
    const quizzesDir = path.join(process.cwd(), "quizzes");
    await seedDatabase(quizzesDir, false); // Don't clean again

    log("\n✓ Workflow completed successfully!", "green");
    log(
      "Database is now fully initialized with topics, users, and questions.",
      "bright"
    );
  } catch (error) {
    log("\n✗ Workflow failed:", "yellow");
    console.error(error);
    process.exit(1);
  }
}

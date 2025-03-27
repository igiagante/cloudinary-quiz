import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  questionRepository,
  QuestionWithOptions as DbQuestionWithOptions,
} from "@/lib/db/repositories/question.repository";
import { Topic } from "@/types";
import { generateQuizFast } from "@/lib/quiz-generator";
import { setProgressCallback, setVerboseLogging } from "@/lib/quiz-generator";

// Define schema for structured output
const questionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctAnswerIndex: z.number().min(0).max(3),
  explanation: z.string(),
  topic: z.string().optional(),
  subtopic: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  tags: z.array(z.string()).optional(),
});

const questionsArraySchema = z.object({
  questions: z.array(questionSchema),
});

// Input validation schema
const GenerateSchema = z.object({
  numQuestions: z.number().min(1).max(30).default(10),
  topics: z.array(z.string()).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  model: z.enum(["openai", "claude", "none"]).default("none"),
  maxNewQuestions: z.number().min(1).max(10).default(3),
  verboseLogging: z.boolean().optional(),
});

// Define a type for option objects
interface OptionWithCorrectness {
  text: string;
  isCorrect: boolean;
}

// Define a type for the question with options
interface FormattableQuestion {
  uuid: string;
  question: string;
  explanation: string;
  topic: string;
  difficulty: string;
  source?: string;
  status?: string;
  qualityScore?: number;
  hasMultipleCorrectAnswers?: boolean;
  options: Array<{ text: string; isCorrect: boolean }>;
}

// Utility function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Utility function to format a question with shuffled options
function formatQuestionWithShuffledOptions(q: FormattableQuestion) {
  if (!q) return null;

  const optionsWithCorrectness: OptionWithCorrectness[] = q.options.map(
    (o) => ({
      text: o.text,
      isCorrect: o.isCorrect,
    })
  );

  // Shuffle the options
  const shuffledOptions = shuffleArray(optionsWithCorrectness);

  // Check if this question should have multiple correct answers
  const questionText = q.question.toLowerCase();
  const textIndicatesMultipleSelection =
    questionText.includes("select up to") ||
    questionText.includes("select all that apply") ||
    questionText.includes("select two") ||
    questionText.includes("select 2") ||
    (questionText.includes("(select") && questionText.includes(")"));

  // Get count from "select up to X" if it exists
  const match = questionText.match(/select up to (\d+)/i);
  const selectUpToCount = match && match[1] ? parseInt(match[1], 10) : 0;

  // Count correct options
  const correctOptions = shuffledOptions.filter((o) => o.isCorrect);

  // IMPORTANT: Use database flag if available, otherwise determine from question text/options
  const hasMultipleCorrectAnswers =
    q.hasMultipleCorrectAnswers === true ||
    correctOptions.length > 1 ||
    (textIndicatesMultipleSelection && selectUpToCount > 1);

  // Get all correct answers for multiple choice questions
  const correctAnswers = hasMultipleCorrectAnswers
    ? shuffledOptions.filter((o) => o.isCorrect).map((o) => o.text)
    : [];

  // For logging/debugging
  if (hasMultipleCorrectAnswers || textIndicatesMultipleSelection) {
    console.log(
      `Multiple selection question detected: "${q.question.substring(
        0,
        40
      )}..."`,
      {
        hasMultipleCorrectAnswers: q.hasMultipleCorrectAnswers,
        dbHasMultiple: q.hasMultipleCorrectAnswers === true,
        correctOptionsCount: correctOptions.length,
        textIndicatesMultipleSelection,
        selectUpToCount,
        settingHasMultiple: hasMultipleCorrectAnswers,
        correctAnswersArray: correctAnswers,
      }
    );
  }

  return {
    id: q.uuid,
    question: q.question,
    options: shuffledOptions.map((o) => o.text),
    correctAnswer: shuffledOptions.find((o) => o.isCorrect)?.text || "",
    correctAnswers: hasMultipleCorrectAnswers ? correctAnswers : [],
    hasMultipleCorrectAnswers: hasMultipleCorrectAnswers,
    explanation: q.explanation,
    topic: q.topic,
    difficulty: q.difficulty,
    source: q.source || "openai", // Include source information
    status: q.status || "active", // Include status information
    qualityScore: q.qualityScore || 0, // Include quality score
  };
}

export async function POST(request: NextRequest) {
  console.log("POST /api/generate-questions - Starting request");

  try {
    const body = await request.json();
    console.log("Request body:", JSON.stringify(body));

    const {
      numQuestions,
      topics,
      difficulty,
      model,
      maxNewQuestions = 3,
      verboseLogging = false,
    } = body;

    // Validate inputs
    if (!numQuestions || typeof numQuestions !== "number" || numQuestions < 1) {
      console.error("Invalid numQuestions:", numQuestions);
      return NextResponse.json(
        { error: "Invalid number of questions" },
        { status: 400 }
      );
    }

    // Determine which model to use for generation
    const useModel = model === "none" ? "none" : model;

    // Collection for progress logs
    const progressLogs: { message: string; level: string }[] = [];

    // Set up progress callback to capture progress with log levels
    setProgressCallback((message, level = "info") => {
      progressLogs.push({ message, level });
    });

    // Set verbose logging based on request parameter
    setVerboseLogging(verboseLogging);

    console.log(
      `Generating quiz with: numQuestions=${numQuestions}, topics=${JSON.stringify(
        topics
      )}, difficulty=${difficulty}, useModel=${useModel}, maxNewQuestions=${maxNewQuestions}`
    );

    try {
      // Generate questions using the fast generator with the updated parameters
      const questions = await generateQuizFast(
        numQuestions,
        topics as Topic[],
        difficulty as "easy" | "medium" | "hard",
        false, // Only use database questions
        useModel,
        0 // No new question generation
      );

      // Remove detailed progress logs
      console.log(`Generated ${questions.length} questions successfully`);

      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        console.error("No valid questions returned:", questions);
        return NextResponse.json(
          { error: "No questions were generated. Please try again." },
          { status: 500 }
        );
      }

      // Return only the questions without progress logs
      return NextResponse.json({
        questions,
        stats: {
          total: questions.length,
          fromDatabase: questions.length,
        },
      });
    } catch (generateError) {
      console.error("Error in generateQuizFast:", generateError);
      throw generateError;
    }
  } catch (error) {
    // Keep only essential error logging
    console.error(
      "Error generating questions:",
      error instanceof Error ? error.message : error
    );
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate questions",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get("topic");
    const difficulty = searchParams.get("difficulty");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || "active"; // Default to active questions
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    let questions;

    if (topic) {
      questions = await questionRepository.getByTopicAndDifficulty(
        [topic],
        difficulty || undefined,
        limit,
        status as string
      );
    } else if (includeDeleted) {
      // Get all questions including deleted ones
      questions = await questionRepository.getAll(true);
      questions = questions.slice(0, limit);
    } else {
      // Get only active questions by default
      questions = await questionRepository.getByStatus(status as any, limit);
    }

    const formattedQuestions = questions
      .map((q) => formatQuestionWithShuffledOptions(q as FormattableQuestion))
      .filter((q) => q !== null);

    return NextResponse.json({ questions: formattedQuestions });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

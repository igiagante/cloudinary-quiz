import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  questionRepository,
  QuestionWithOptions as DbQuestionWithOptions,
} from "@/lib/db/repositories/question.repository";
import { Topic } from "@/types";
import { generateQuizFast } from "@/lib/quiz-generator";
import { setProgressCallback, setVerboseLogging } from "@/lib/quiz-generator";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { questions } from "@/lib/db/schema";

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
  id: string | number; // Support both types
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
    id: q.id?.toString() || nanoid(),
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

export async function POST(req: Request) {
  try {
    const {
      numQuestions,
      topics,
      difficulty,
      model = "none",
      maxNewQuestions = 3,
    } = await req.json();

    console.log(
      `Generating quiz with: numQuestions=${numQuestions}, topics=${JSON.stringify(
        topics
      )}, difficulty=${difficulty}, useModel=${model}, maxNewQuestions=${maxNewQuestions}`
    );

    // Initialize array to hold our questions
    let generatedQuestions: Array<{
      id: string;
      question: string;
      options: any;
      correctAnswer: string;
      topic: string;
      difficulty: string;
      explanation?: string;
      source?: string;
      status?: string;
      qualityScore?: number;
      hasMultipleCorrectAnswers?: boolean;
      correctAnswers?: string[];
    }> = [];

    // Only fetch from database when model is "none" (database only)
    if (model === "none") {
      console.log("Using database questions only...");

      // Fetch actual questions from the database based on topics
      let dbQuestions: (typeof questions.$inferSelect)[] = [];

      for (const topic of topics) {
        console.log(
          `Fetching up to ${Math.ceil(
            numQuestions / topics.length
          )} questions for ${topic}...`
        );

        const topicQuestions = await db.query.questions.findMany({
          where: eq(questions.topic, topic),
          limit: Math.ceil(numQuestions / topics.length) + 5, // Get a few extra for diversity
        });

        console.log(
          `Found ${topicQuestions.length} questions for ${topic} in database`
        );
        dbQuestions = [...dbQuestions, ...topicQuestions];
      }

      // Shuffle and limit to requested number
      if (dbQuestions.length > numQuestions) {
        dbQuestions = dbQuestions
          .sort(() => 0.5 - Math.random())
          .slice(0, numQuestions);
      }

      // Log the actual question IDs from the database
      console.log(
        "Selected question IDs from database:",
        dbQuestions.map((q) => q.id)
      );

      // Format questions for the response
      generatedQuestions = dbQuestions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        topic: q.topic,
        difficulty: q.difficulty || "medium",
        // Include other necessary fields
      }));
    } else {
      // Handle AI model generation or other methods here
      // This is your existing logic for when the user selects an AI model
      // ...
      console.log("Using AI model or mixed generation...");

      // Your existing question generation logic goes here
      // ...

      // Make sure the generated questions exist in the database or are properly saved
    }

    if (generatedQuestions.length === 0) {
      console.log("No questions generated!");
      return NextResponse.json(
        { error: "Could not generate questions" },
        { status: 404 }
      );
    }

    console.log(
      `Generated ${generatedQuestions.length} questions successfully`
    );
    return NextResponse.json({ questions: generatedQuestions });
  } catch (error) {
    console.error("Error generating questions:", error);
    return NextResponse.json(
      { error: "Failed to generate questions" },
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

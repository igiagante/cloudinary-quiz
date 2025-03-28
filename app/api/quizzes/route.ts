// app/api/quizzes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTestUserId } from "@/lib/utils";
import { closeConnection } from "@/lib/db";
import { QuizService } from "@/lib/services/quiz.service";
import { debug } from "@/lib/debug";

// Input validation schema for creating a quiz
const createQuizSchema = z.object({
  userId: z.string().optional(),
  numQuestions: z.number().min(1).max(30).default(10),
  topics: z.array(z.string()).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  questionIds: z.array(z.string()).optional(), // Allow passing specific question IDs
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { userId, numQuestions, topics, difficulty, questionIds } =
      createQuizSchema.parse(body);

    // Use the test user ID if not provided
    const effectiveUserId = userId || getTestUserId();

    if (!effectiveUserId) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Use the QuizService to create the quiz
    const quizService = new QuizService();
    const result = await quizService.createQuiz({
      userId: effectiveUserId,
      numQuestions,
      topics,
      difficulty,
      questionIds,
    });

    return NextResponse.json(result);
  } catch (error) {
    debug.error("Error creating quiz:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create quiz",
      },
      { status: 500 }
    );
  } finally {
    // Ensure connection is closed
    await closeConnection();
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const quizId = url.searchParams.get("id");
    const userId = url.searchParams.get("userId");

    const quizService = new QuizService();

    if (quizId) {
      // Get a specific quiz by ID
      const quiz = await quizService.getQuizById(quizId);
      if (!quiz) {
        return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
      }
      return NextResponse.json(quiz);
    } else if (userId) {
      // Get quiz history for a user
      const quizHistory = await quizService.getQuizHistoryByUser(userId);
      return NextResponse.json({ quizHistory });
    } else {
      return NextResponse.json(
        { error: "Missing id or userId parameter" },
        { status: 400 }
      );
    }
  } catch (error) {
    debug.error("Error fetching quizzes:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch quizzes",
      },
      { status: 500 }
    );
  } finally {
    // Close connection after request is done
    await closeConnection();
  }
}

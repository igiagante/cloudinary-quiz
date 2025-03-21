// app/api/quizzes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { quizRepository } from "@/lib/db/repositories/quiz.repository";
import { questionRepository } from "@/lib/db/repositories/question.repository";

// Input validation schema for creating a quiz
const createQuizSchema = z.object({
  userId: z.string().optional(),
  numQuestions: z.number().min(1).max(30).default(10),
  topics: z.array(z.string()).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, numQuestions, topics, difficulty } =
      createQuizSchema.parse(body);

    // Get questions from the database
    let questions;
    if (topics && topics.length > 0) {
      questions = await questionRepository.getByTopicAndDifficulty(
        topics,
        difficulty,
        numQuestions
      );
    } else {
      // Get random questions
      const allTopics = await questionRepository.getAllTopics();
      questions = await questionRepository.getByTopicAndDifficulty(
        allTopics,
        difficulty,
        numQuestions
      );
    }

    // If we don't have enough questions, return an error
    if (questions.length < numQuestions) {
      return NextResponse.json(
        {
          error: `Not enough questions available. Requested ${numQuestions}, found ${questions.length}`,
        },
        { status: 400 }
      );
    }

    // Create a new quiz with the selected questions
    const questionIds = questions.map((q) => q.id);
    const quizId = await quizRepository.create({
      userId,
      numQuestions,
      questionIds,
    });

    return NextResponse.json({ quizId });
  } catch (error) {
    console.error("Error creating quiz:", error);
    return NextResponse.json(
      { error: "Failed to create quiz" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (quizId) {
      // Get a specific quiz
      const quiz = await quizRepository.getByUuid(quizId);

      if (!quiz) {
        return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
      }

      return NextResponse.json({ quiz });
    } else if (userId) {
      // Get quiz history for a user
      const quizHistory = await quizRepository.getQuizHistory(userId);
      return NextResponse.json({ quizHistory });
    } else {
      // Get quiz statistics
      const stats = await quizRepository.getQuizStatistics();
      return NextResponse.json({ stats });
    }
  } catch (error) {
    console.error("Error fetching quiz data:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz data" },
      { status: 500 }
    );
  }
}

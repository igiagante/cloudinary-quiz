// app/api/quizzes/[quizId]/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { debug } from "@/lib/debug";
import { QuizService } from "@/lib/services/quiz.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;

    const quizService = new QuizService();
    const quiz = await quizService.getQuizById(quizId);

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    if (quiz.isCompleted) {
      return NextResponse.json(
        { error: "Quiz already completed" },
        { status: 400 }
      );
    }

    // Calculate score
    const totalQuestions = quiz.questions.length;
    const correctAnswers = quiz.questions.filter((q) => q.isCorrect).length;
    const score = quizService.calculateScore(correctAnswers, totalQuestions);

    // Complete the quiz
    await quizService.completeQuiz(quiz.id, correctAnswers, totalQuestions, []);

    return NextResponse.json({
      quizId: quiz.id,
      totalQuestions,
      correctAnswers,
      score,
      passed: score >= quiz.passPercentage,
      topicPerformance: [], // Empty array for now since we don't have the data
    });
  } catch (error) {
    debug.error("Error completing quiz:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to complete quiz",
      },
      { status: 500 }
    );
  }
}

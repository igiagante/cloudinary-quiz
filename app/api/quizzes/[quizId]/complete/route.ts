// app/api/quizzes/[quizId]/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { quizRepository } from "@/lib/db/repositories/quiz.repository";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const quiz = await quizRepository.getById(quizId);

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
    const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);

    // Complete the quiz
    await quizRepository.completeQuiz(quiz.id, scorePercentage, []);

    return NextResponse.json({
      quizId: quiz.id,
      totalQuestions,
      correctAnswers,
      score: scorePercentage,
      passed: scorePercentage >= quiz.passPercentage,
      topicPerformance: [], // Empty array for now since we don't have the data
    });
  } catch (error) {
    console.error("Error completing quiz:", error);
    return NextResponse.json(
      { error: "Failed to complete quiz" },
      { status: 500 }
    );
  }
}

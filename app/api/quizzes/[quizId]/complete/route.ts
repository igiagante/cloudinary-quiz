// app/api/quizzes/[quizId]/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { quizRepository } from "@/lib/db/repositories/quiz.repository";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const body = await request.json();
    const { score, topicPerformance } = body;

    // Get quiz by UUID to get its numeric ID
    const quiz = await quizRepository.getByUuid(quizId);
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Complete the quiz and calculate results
    await quizRepository.completeQuiz(quiz.id, score, topicPerformance);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing quiz:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to complete quiz",
      },
      { status: 500 }
    );
  }
}

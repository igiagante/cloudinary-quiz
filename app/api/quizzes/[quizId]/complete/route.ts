// app/api/quizzes/[quizId]/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { quizRepository } from "@/lib/db/repositories/quiz.repository";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;

    // Complete the quiz and calculate results
    const results = await quizRepository.completeQuiz(quizId);

    return NextResponse.json({ results });
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

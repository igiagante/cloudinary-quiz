// app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { questionRepository } from "@/lib/db/repositories/question.repository";
import { quizRepository } from "@/lib/db/repositories/quiz.repository";

export async function GET(request: NextRequest) {
  try {
    // Get question statistics
    const questionStats = await questionRepository.getStats();

    // Get quiz statistics
    const quizStats = await quizRepository.getQuizStatistics();

    return NextResponse.json({
      questions: questionStats,
      quizzes: quizStats,
    });
  } catch (error) {
    console.error("Error fetching admin statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin statistics" },
      { status: 500 }
    );
  }
}

// app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { quizRepository } from "@/lib/db/repositories/quiz.repository";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (quizId) {
      // Get a specific quiz
      const quiz = await quizRepository.getById(quizId);
    } else if (userId) {
      // Get quiz history for a user
      const quizHistory = await quizRepository.getQuizHistory(userId);
      const quizStats = await quizRepository.getQuizStats(userId);

      return NextResponse.json({
        quizzes: quizStats,
      });
    }

    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching admin statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin statistics" },
      { status: 500 }
    );
  }
}

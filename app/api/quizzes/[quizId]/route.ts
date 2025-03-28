import { NextRequest, NextResponse } from "next/server";
import { debug } from "@/lib/debug";
import { QuizService } from "@/lib/services/quiz.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const { quizId } = await params;

  try {
    // Log quiz ID being fetched
    debug.log(`Fetching quiz with ID: ${quizId}`);

    // Use QuizService to get the quiz
    const quizService = new QuizService();
    const quiz = await quizService.getQuizById(quizId);

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    debug.log(`Found quiz with ${quiz.questions.length} questions`);

    return NextResponse.json(quiz);
  } catch (error: any) {
    debug.error(`Error fetching quiz ${quizId}:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch quiz" },
      { status: 500 }
    );
  }
}

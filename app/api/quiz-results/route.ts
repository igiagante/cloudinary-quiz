import { NextRequest, NextResponse } from "next/server";
import { QuizQuestion } from "@/types";
import { debug } from "@/lib/debug";
import { QuizResultsService } from "@/lib/services/quiz-results.service";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const quizId = url.searchParams.get("quizId");

    if (!quizId) {
      return NextResponse.json(
        { error: "Quiz ID parameter is required" },
        { status: 400 }
      );
    }

    // Use the QuizResultsService to get quiz results
    const resultsService = new QuizResultsService();
    const results = await resultsService.getQuizResults(quizId);

    return NextResponse.json(results);
  } catch (error) {
    debug.error("Error fetching quiz results:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch quiz results",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questions, userAnswers, userId, quizId } = body;

    if (!questions || !userAnswers) {
      return NextResponse.json(
        { error: "Missing required data" },
        { status: 400 }
      );
    }

    // Use the QuizResultsService to generate a report
    const resultsService = new QuizResultsService();
    const report = await resultsService.generateReport({
      questions,
      userAnswers,
      userId,
      quizId,
    });

    return NextResponse.json(report);
  } catch (error) {
    debug.error("Error generating quiz report:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate report",
      },
      { status: 500 }
    );
  }
}

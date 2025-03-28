import { NextRequest, NextResponse } from "next/server";
import { debug } from "@/lib/debug";
import { QuizReportService } from "@/lib/services/quiz-report.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questions, userAnswers, userId, quizId } = body;

    if (!questions || !userAnswers) {
      return NextResponse.json(
        {
          error:
            "Missing required data: questions and userAnswers are required",
        },
        { status: 400 }
      );
    }

    debug.log(`Generating quiz report for ${questions.length} questions`);

    // Use the QuizReportService to generate the report
    const reportService = new QuizReportService();
    const report = await reportService.generateQuizReport(
      questions,
      userAnswers,
      userId
    );

    return NextResponse.json({
      results: {
        quizId: report.quizId,
        score: report.score,
        passed: report.passed,
        topicBreakdown: report.topicBreakdown,
        improvementAreas: report.improvementAreas,
        strengths: report.strengths,
      },
    });
  } catch (error) {
    debug.error("Error generating quiz report:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate quiz report",
      },
      { status: 500 }
    );
  }
}

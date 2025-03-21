// app/api/generate-report/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateQuizReport } from "@/lib/quiz-report";
import { QuizQuestion } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { questions, userAnswers, userId } = body;

    if (!questions || !userAnswers) {
      return NextResponse.json(
        { error: "Missing required data" },
        { status: 400 }
      );
    }

    const results = await generateQuizReport(
      questions as QuizQuestion[],
      userAnswers as Record<string, string>,
      userId
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[Debug] Error in generate-report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

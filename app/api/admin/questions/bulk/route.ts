import { NextRequest, NextResponse } from "next/server";
import {
  questionRepository,
  QuestionInput,
} from "@/lib/db/repositories/question.repository";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { questions } = await request.json();

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "No valid questions provided" },
        { status: 400 }
      );
    }

    // Validate each question
    const validQuestions = questions.filter((q: QuestionInput) => {
      return (
        q.question &&
        q.options &&
        Array.isArray(q.options) &&
        q.options.length > 0 &&
        q.options.some((o) => o.isCorrect)
      );
    });

    if (validQuestions.length === 0) {
      return NextResponse.json(
        { error: "No valid questions after validation" },
        { status: 400 }
      );
    }

    // Insert questions into database
    const count = await questionRepository.bulkInsert(validQuestions);

    return NextResponse.json({ count, success: true });
  } catch (error) {
    console.error("Error inserting bulk questions:", error);
    return NextResponse.json(
      { error: "Failed to insert questions" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    { message: "Use POST to bulk insert questions" },
    { status: 405 }
  );
}

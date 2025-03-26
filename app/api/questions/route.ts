import { NextResponse } from "next/server";
import { questionRepository } from "@/lib/db/repositories/question.repository";

export async function GET() {
  try {
    const questions = await questionRepository.getAll();

    // Format questions in the expected format
    const formattedQuestions = questions.map((q) => ({
      id: q.uuid,
      question: q.question,
      options: q.options.map((o) => o.text),
      correctAnswer: q.options.find((o) => o.isCorrect)?.text || "",
      explanation: q.explanation,
      topic: q.topic,
      difficulty: q.difficulty,
    }));

    return NextResponse.json({ questions: formattedQuestions });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

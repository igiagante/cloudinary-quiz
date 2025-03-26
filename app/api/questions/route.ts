import { NextResponse } from "next/server";
import { questionRepository } from "@/lib/db/repositories/question.repository";

export async function GET() {
  try {
    const questions = await questionRepository.getAll();

    // Format questions in the expected format
    const formattedQuestions = questions.map((q) => {
      // Check for multiple correct answers
      const correctOptions = q.options.filter((o) => o.isCorrect);
      const hasMultipleCorrectAnswers = correctOptions.length > 1;

      return {
        id: q.uuid,
        question: q.question,
        options: q.options.map((o) => o.text),
        correctAnswer: q.options.find((o) => o.isCorrect)?.text || "",
        correctAnswers: hasMultipleCorrectAnswers
          ? correctOptions.map((o) => o.text)
          : [],
        hasMultipleCorrectAnswers: hasMultipleCorrectAnswers,
        explanation: q.explanation,
        topic: q.topic,
        difficulty: q.difficulty,
      };
    });

    return NextResponse.json({ questions: formattedQuestions });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

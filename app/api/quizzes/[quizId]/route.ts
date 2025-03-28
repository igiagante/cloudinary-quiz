import { quizRepository } from "@/lib/db/repositories/quiz.repository";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const { quizId } = await params;

  try {
    // Log quiz ID being fetched
    console.log(`Fetching quiz with ID: ${quizId}`);

    // Get the quiz with all its questions
    const quiz = await quizRepository.getById(quizId);

    if (!quiz) {
      console.error(`Quiz with ID ${quizId} not found`);
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    console.log(`Found quiz with ${quiz.questions.length} questions`);

    // Transform quiz data for frontend
    const quizForFrontend = {
      id: quiz.id,
      numQuestions: quiz.numQuestions,
      isCompleted: quiz.isCompleted,
      score: quiz.score,
      questions: quiz.questions.map((q) => {
        // Get the correct option for this question
        const correctOption = q.question.options.find((o) => o.isCorrect);

        // Find all correct options if multiple
        const correctOptions = q.question.options.filter((o) => o.isCorrect);

        // Determine if this question has multiple correct answers
        const hasMultipleCorrectAnswers = correctOptions.length > 1;

        // Get the correct answer text (for single-answer questions)
        const correctAnswer = correctOption ? correctOption.text : "";

        // Get all correct answers for multiple-choice questions
        const correctAnswers = correctOptions.map((o) => o.text);

        return {
          id: q.questionId,
          questionId: q.questionId,
          uuid: q.questionId,
          question: q.question.question,
          options: q.question.options.map((o) => o.text),
          topic: q.question.topic,
          difficulty: q.question.difficulty,
          explanation: q.question.explanation,
          userAnswer: q.userAnswer,
          isCorrect: q.isCorrect,
          correctAnswer: correctAnswer,
          correctAnswers: correctAnswers,
          hasMultipleCorrectAnswers: hasMultipleCorrectAnswers,
        };
      }),
    };

    return NextResponse.json(quizForFrontend);
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    );
  }
}

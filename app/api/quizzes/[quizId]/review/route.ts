import { NextResponse } from "next/server";
import { quizRepository } from "@/lib/db/repositories/quiz.repository";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const { quizId } = await params;

    console.log(`Review request for quizId: ${quizId}, userId: ${userId}`);

    if (!quizId || !userId) {
      return NextResponse.json(
        { error: "Missing quizId or userId" },
        { status: 400 }
      );
    }

    // Get the quiz with all questions
    const quiz = await quizRepository.getById(quizId);

    if (!quiz) {
      console.log(`Quiz not found: ${quizId}`);
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Verify quiz belongs to user or is completed
    // Note: We're only checking if the quiz exists and is completed, not strictly matching the userId
    // This allows for reviewing any completed quiz
    if (!quiz.isCompleted) {
      console.log(`Quiz not completed: ${quizId}`);
      return NextResponse.json(
        { error: "Quiz must be completed before review" },
        { status: 400 }
      );
    }

    console.log(
      `Found quiz for review - id: ${quizId}, questions: ${quiz.questions.length}`
    );

    // Format the questions for the review page
    const formattedQuestions = quiz.questions.map((q) => {
      // Find correct answer(s)
      const correctOptionIndices = q.question.options
        .map((o, i) => (o.isCorrect ? i : -1))
        .filter((i) => i !== -1);

      const correctOptions = q.question.options.filter((o) => o.isCorrect);
      const hasMultipleCorrectAnswers = correctOptions.length > 1;

      // Get correct answer(s) text
      const correctAnswer = hasMultipleCorrectAnswers
        ? correctOptions.map((o) => o.text)
        : correctOptions[0]?.text || "";

      // Get the user's selected option text
      let userAnswer = null;
      if (q.userAnswer !== undefined) {
        const userSelectedOption = q.question.options.find(
          (o, i) => String(i) === String(q.userAnswer)
        );
        userAnswer = userSelectedOption?.text || null;
      }

      return {
        id: q.questionId,
        question: q.question.question,
        options: q.question.options.map((o) => o.text),
        correctAnswer: correctAnswer,
        explanation: q.question.explanation || "No explanation provided",
        topic: q.question.topic,
        userAnswer: userAnswer,
        isCorrect: q.isCorrect,
      };
    });

    const response = {
      quizId: quiz.id,
      userId: quiz.userId || "",
      completedAt: quiz.completedAt?.toISOString() || new Date().toISOString(),
      questions: formattedQuestions,
    };

    console.log(
      `Successfully formatted quiz review data with ${formattedQuestions.length} questions`
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching quiz review data:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz review data" },
      { status: 500 }
    );
  }
}

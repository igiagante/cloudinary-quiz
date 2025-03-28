import { NextRequest, NextResponse } from "next/server";
import { quizRepository } from "@/lib/db/repositories/quiz.repository";

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

    console.log(`Fetching quiz results for quizId: ${quizId}`);

    // Fetch quiz with questions and answers
    const quizWithQuestions = await quizRepository.getById(quizId);

    if (!quizWithQuestions) {
      console.log(`Quiz not found: ${quizId}`);
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Check if quiz is completed
    if (!quizWithQuestions.isCompleted) {
      console.log(`Quiz not completed yet: ${quizId}`);
      return NextResponse.json(
        { error: "Quiz is not completed yet" },
        { status: 400 }
      );
    }

    console.log(`Quiz data retrieved successfully for ${quizId}`);
    console.log(
      `Topic performance data: ${JSON.stringify(
        quizWithQuestions.topicPerformance || []
      )}`
    );

    // Calculate duration if completedAt and createdAt are available
    let duration = "00:00:00";
    if (quizWithQuestions.completedAt && quizWithQuestions.createdAt) {
      const start = new Date(quizWithQuestions.createdAt).getTime();
      const end = new Date(quizWithQuestions.completedAt).getTime();
      const durationMs = end - start;

      // Format as hh:mm:ss
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

      duration = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

      console.log(`Quiz duration: ${duration} (${durationMs}ms)`);
    }

    // Prepare quiz results for the frontend
    const results = {
      quizId: quizWithQuestions.id,
      createdAt: quizWithQuestions.createdAt,
      completedAt: quizWithQuestions.completedAt,
      duration: duration,
      score: quizWithQuestions.score,
      passPercentage: quizWithQuestions.passPercentage,
      passed:
        (quizWithQuestions.score || 0) >= quizWithQuestions.passPercentage,
      totalQuestions: quizWithQuestions.numQuestions,
      questions: quizWithQuestions.questions.map((q) => ({
        questionId: q.questionId,
        question: q.question.question,
        userAnswerIndex: q.userAnswer,
        isCorrect: q.isCorrect,
        correctAnswerIndex: q.question.options.findIndex((o) => o.isCorrect),
      })),
      topicPerformance: quizWithQuestions.topicPerformance || [],
      topicScores: (quizWithQuestions.topicPerformance || []).map((tp) => ({
        name: tp.topic,
        score: tp.correct,
        possible: tp.total,
        weight: tp.total / quizWithQuestions.numQuestions,
      })),
    };

    console.log(
      `Formatted topic scores: ${JSON.stringify(results.topicScores || [])}`
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching quiz results:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz results" },
      { status: 500 }
    );
  }
}

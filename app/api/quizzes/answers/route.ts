import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { debug } from "@/lib/debug";
import { QuizAnswerService } from "@/lib/services/quiz-answer.service";
import { QuizService } from "@/lib/services/quiz.service";

// Input validation schema for submitting quiz answers
const submitAnswersSchema = z.object({
  quizId: z.string(),
  userId: z.string(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.array(z.string()),
    })
  ),
  isComplete: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { quizId, userId, answers, isComplete } =
      submitAnswersSchema.parse(body);

    // Initialize services
    const quizService = new QuizService();
    const answerService = new QuizAnswerService();

    // Get quiz data
    const quiz = await quizService.getQuizById(quizId);
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Check if quiz is already completed
    if (quiz.isCompleted) {
      return NextResponse.json(
        { error: "Cannot update answers for completed quiz" },
        { status: 400 }
      );
    }

    // Verify question IDs match between client and server
    const clientQuestionIds = new Set(answers.map((a) => a.questionId));
    const serverQuestionIds = new Set(quiz.questions.map((q) => q.questionId));

    // Log any questions that don't match
    clientQuestionIds.forEach((id) => {
      if (!serverQuestionIds.has(id)) {
        debug.error(
          `Client sent question ID ${id} that doesn't exist in the server quiz`
        );
      }
    });

    // Process quiz answers
    debug.log(`Processing ${answers.length} answers for quiz ${quizId}`);
    const { correctCount, processedAnswers, questionMap } =
      await answerService.processAnswers(quiz, answers);

    // Complete the quiz if requested
    if (isComplete) {
      const topicPerformance = answerService.calculateTopicPerformance(
        quiz,
        questionMap
      );
      await quizService.completeQuiz(
        quiz.id,
        correctCount,
        quiz.questions.length,
        topicPerformance
      );
    }

    // Return the results
    return NextResponse.json({
      success: true,
      processed: processedAnswers.length,
      correct: correctCount,
      score: isComplete
        ? quizService.calculateScore(correctCount, quiz.questions.length)
        : null,
    });
  } catch (error) {
    debug.error("Error processing quiz answers:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process quiz answers",
      },
      { status: 500 }
    );
  }
}

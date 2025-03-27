import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { quizRepository } from "@/lib/db/repositories/quiz.repository";

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
    const body = await request.json();
    const { quizId, userId, answers, isComplete } =
      submitAnswersSchema.parse(body);

    // Get quiz by UUID
    const quiz = await quizRepository.getByUuid(quizId);
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Process each answer
    const processedAnswers = [];
    let correctCount = 0;
    const totalQuestions = answers.length;

    // Get all questions from the quiz
    for (const answerItem of answers) {
      const { questionId, answer } = answerItem;
      const questionInQuiz = quiz.questions.find(
        (q) => q.question.uuid === questionId
      );

      if (!questionInQuiz) {
        continue; // Skip if question not found in quiz
      }

      const question = questionInQuiz.question;

      // Process single or multiple answers
      let isCorrect = false;
      if (question.hasMultipleCorrectAnswers) {
        // For multiple answer questions - check if all correct options are selected and no incorrect ones
        const correctOptions = question.options
          .filter((o) => o.isCorrect)
          .map((o) => o.id.toString());
        isCorrect =
          answer.length === correctOptions.length &&
          correctOptions.every((id) => answer.includes(id));
      } else {
        // For single answer questions
        isCorrect =
          answer.length === 1 &&
          question.options.some(
            (o) => o.id.toString() === answer[0] && o.isCorrect
          );
      }

      // Update the answer in the database
      await quizRepository.updateQuizAnswer(
        quiz.id,
        question.id.toString(), // Use database ID, not UUID
        parseInt(answer[0], 10), // Parse the answer ID to number with base 10
        isCorrect
      );

      if (isCorrect) {
        correctCount++;
      }

      processedAnswers.push({
        questionId,
        isCorrect,
      });
    }

    // If the quiz is marked as complete, update its status
    if (isComplete) {
      const score = Math.round((correctCount / totalQuestions) * 100);

      // Calculate topic performance
      const topicPerformance: Record<
        string,
        { correct: number; total: number }
      > = {};

      for (const qItem of quiz.questions) {
        const topic = qItem.question.topic;
        if (!topicPerformance[topic]) {
          topicPerformance[topic] = { correct: 0, total: 0 };
        }

        const answer = processedAnswers.find(
          (a) => a.questionId === qItem.question.uuid
        );
        if (answer) {
          topicPerformance[topic].total++;
          if (answer.isCorrect) {
            topicPerformance[topic].correct++;
          }
        }
      }

      // Format topic performance for the repository
      const topicPerformanceData = Object.entries(topicPerformance).map(
        ([topic, data]) => ({
          topic,
          correct: data.correct,
          total: data.total,
          percentage: Math.round((data.correct / data.total) * 100),
        })
      );

      // Complete the quiz
      await quizRepository.completeQuiz(quiz.id, score, topicPerformanceData);
    }

    return NextResponse.json({
      success: true,
      processed: processedAnswers.length,
      correct: correctCount,
      score: isComplete
        ? Math.round((correctCount / totalQuestions) * 100)
        : null,
    });
  } catch (error) {
    console.error("Error saving quiz answers:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save quiz answers",
      },
      { status: 500 }
    );
  }
}

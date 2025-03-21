// lib/quiz-report.ts
import { analyzeQuizResults } from "@/lib/quiz-generator";
import { QuizQuestion, QuizResults, Topic } from "@/types";
import { quizRepository } from "@/lib/db/repositories/quiz.repository";
import { v4 as uuidv4 } from "uuid";

export async function generateQuizReport(
  questions: QuizQuestion[],
  userAnswers: Record<string, string>,
  userId?: string // Optional user ID for tracking
): Promise<QuizResults & { quizId: string }> {
  // Analyze the quiz results
  const results = analyzeQuizResults(questions, userAnswers);

  // Prepare data for database
  const quizData = {
    uuid: uuidv4(),
    userId: userId || undefined,
    numQuestions: questions.length,
    isCompleted: true,
    score: Math.round(results.score.percentage),
    passPercentage: 80,
    completedAt: new Date(),
    createdAt: new Date(),
  };

  try {
    // Save quiz to database
    const quizId = await quizRepository.create({
      userId: userId,
      numQuestions: questions.length,
      questionIds: [], // We'll need to map these from the front-end questions to DB questions
    });

    // For each question, save the user's answer
    for (const question of questions) {
      const dbQuestionId = await mapQuestionIdToDbId(question.id);
      const userAnswer = userAnswers[question.id];
      const isCorrect = userAnswer === question.correctAnswer;

      if (dbQuestionId) {
        await quizRepository.answerQuestion({
          quizId,
          questionId: dbQuestionId,
          optionId: await mapAnswerToOptionId(dbQuestionId, userAnswer),
        });
      }
    }

    // Complete the quiz to calculate and save topic performance
    const completionResults = await quizRepository.completeQuiz(quizId);

    // Return the analyzed results with the saved quiz ID
    return {
      ...results,
      topicBreakdown: Object.entries(results.topicPerformance)
        .filter(([_, data]) => data.total > 0)
        .map(([topic, data]) => ({
          topic: topic as Topic,
          correct: data.correct,
          total: data.total,
          percentage: data.percentage,
        })),
      quizId,
    };
  } catch (error) {
    console.error("Error saving quiz results to database:", error);

    // Still return the analysis results even if saving failed
    return {
      ...results,
      topicBreakdown: Object.entries(results.topicPerformance)
        .filter(([_, data]) => data.total > 0)
        .map(([topic, data]) => ({
          topic: topic as Topic,
          correct: data.correct,
          total: data.total,
          percentage: data.percentage,
        })),
      quizId: "error-saving", // Indicate that saving failed
    };
  }
}

// Helper function to map front-end question ID to database ID
async function mapQuestionIdToDbId(frontendId: string): Promise<number | null> {
  // Implementation depends on how you're storing the mapping
  // This could query the database for a question with matching content
  // For now, we'll return null, which will skip saving this question
  return null;
}

// Helper function to map an answer text to its option ID in the database
async function mapAnswerToOptionId(
  questionId: number,
  answerText: string
): Promise<number> {
  // Implementation depends on your database structure
  // This would query the options table for the matching text
  // For now, we'll return a placeholder
  return 1; // Placeholder
}

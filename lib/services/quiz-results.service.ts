import { debug } from "@/lib/debug";
import { quizRepository } from "@/lib/db/repositories/quiz.repository";
import { generateQuizReport } from "@/lib/quiz-report";
import { QuizQuestion } from "@/types";

export interface QuizResult {
  quizId: string;
  createdAt: Date;
  completedAt?: Date;
  duration: string;
  score: number | null | undefined;
  passPercentage: number;
  passed: boolean;
  totalQuestions: number;
  questions: {
    questionId: string;
    question: string;
    userAnswerIndex: number | null | undefined;
    isCorrect: boolean | null | undefined;
    correctAnswerIndex: number;
  }[];
  topicPerformance: Array<{
    topic: string;
    correct: number;
    total: number;
    percentage: number;
  }>;
  topicScores: Array<{
    name: string;
    score: number;
    possible: number;
    weight: number;
  }>;
}

export interface ReportGenerationInput {
  questions: QuizQuestion[];
  userAnswers: Record<string, string>;
  userId?: string;
  quizId?: string;
}

/**
 * Service for handling quiz results operations
 */
export class QuizResultsService {
  /**
   * Get quiz results by quiz ID
   */
  async getQuizResults(quizId: string): Promise<QuizResult> {
    debug.log(`Fetching results for quiz ${quizId}`);

    // Fetch quiz with questions and answers
    const quizWithQuestions = await quizRepository.getById(quizId);

    if (!quizWithQuestions) {
      throw new Error("Quiz not found");
    }

    // Check if quiz is completed
    if (!quizWithQuestions.isCompleted) {
      throw new Error("Quiz is not completed yet");
    }

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
    }

    // Prepare quiz results
    const results: QuizResult = {
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

    debug.log(`Successfully retrieved results for quiz ${quizId}`);
    return results;
  }

  /**
   * Generate a quiz report from questions and answers
   */
  async generateReport(input: ReportGenerationInput): Promise<any> {
    debug.log(`Generating report for quiz ${input.quizId || "new quiz"}`);
    const { questions, userAnswers, userId, quizId } = input;

    // If quizId is provided, first try to get results from the database
    if (quizId) {
      try {
        const existingQuiz = await quizRepository.getById(quizId);
        if (existingQuiz && existingQuiz.isCompleted) {
          // Return the existing results
          debug.log(
            `Found existing completed quiz ${quizId}, returning saved results`
          );
          return {
            results: {
              quizId: existingQuiz.id,
              score: existingQuiz.score,
              passPercentage: existingQuiz.passPercentage,
              passed: (existingQuiz.score || 0) >= existingQuiz.passPercentage,
              topicPerformance: existingQuiz.topicPerformance || [],
            },
          };
        }
      } catch (error) {
        // Continue to generate a new report
        debug.error("Error fetching existing quiz:", error);
      }
    }

    // Generate a new report
    const results = await generateQuizReport(questions, userAnswers, userId);

    debug.log(
      `Successfully generated report for ${questions.length} questions`
    );
    return { results };
  }
}

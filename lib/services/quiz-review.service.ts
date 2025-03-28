import { debug } from "@/lib/debug";
import { QuizService } from "./quiz.service";

/**
 * Interface for a formatted review question
 */
interface ReviewQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string | string[];
  explanation: string;
  topic: string;
  userAnswer: string | null;
  isCorrect: boolean | null;
}

/**
 * Interface for quiz review data
 */
export interface QuizReviewData {
  quizId: string;
  userId: string;
  completedAt: string;
  questions: ReviewQuestion[];
}

/**
 * Service for quiz review functionality
 */
export class QuizReviewService {
  private quizService: QuizService;

  constructor() {
    this.quizService = new QuizService();
  }

  /**
   * Get formatted review data for a completed quiz
   */
  async getQuizReviewData(
    quizId: string,
    userId: string
  ): Promise<QuizReviewData> {
    debug.log(`Preparing review data for quiz ${quizId}, user ${userId}`);

    // Get the quiz with all questions
    const quiz = await this.quizService.getQuizById(quizId);

    if (!quiz) {
      debug.error(`Quiz not found: ${quizId}`);
      throw new Error("Quiz not found");
    }

    // Verify quiz is completed
    if (!quiz.isCompleted) {
      debug.error(`Quiz not completed: ${quizId}`);
      throw new Error("Quiz must be completed before review");
    }

    debug.log(
      `Found quiz for review - id: ${quizId}, questions: ${quiz.questions.length}`
    );

    // Format the questions for the review page
    const formattedQuestions = quiz.questions.map((q): ReviewQuestion => {
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
      if (q.userAnswer !== undefined && q.userAnswer !== null) {
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
        isCorrect: q.isCorrect ?? null,
      };
    });

    return {
      quizId: quiz.id,
      userId: quiz.userId || "",
      completedAt: quiz.completedAt?.toISOString() || new Date().toISOString(),
      questions: formattedQuestions,
    };
  }
}

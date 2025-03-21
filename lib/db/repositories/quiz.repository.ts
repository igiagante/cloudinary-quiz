// db/repositories/quizRepository.ts
import { eq, and, desc, sql, count } from "drizzle-orm";
import { db } from "../index";
import {
  quizzes,
  quizQuestions,
  topicPerformance,
  questions,
  options,
} from "../schema";
import { v4 as uuidv4 } from "uuid";
import { QuestionWithOptions } from "./question.repository";

export type QuizWithQuestions = {
  id: number;
  uuid: string;
  userId?: string;
  numQuestions: number;
  isCompleted: boolean;
  score?: number;
  passPercentage: number;
  createdAt: Date;
  completedAt?: Date;
  questions: Array<{
    questionId: number;
    question: QuestionWithOptions;
    userAnswer?: number;
    isCorrect?: boolean;
  }>;
  topicPerformance?: Array<{
    topic: string;
    correct: number;
    total: number;
    percentage: number;
  }>;
};

export type NewQuizInput = {
  userId?: string;
  numQuestions: number;
  questionIds: number[];
};

export type QuizAnswerInput = {
  quizId: string;
  questionId: number;
  optionId: number;
};

export type QuizCompletionResult = {
  quizId: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  passed: boolean;
  topicPerformance: Array<{
    topic: string;
    correct: number;
    total: number;
    percentage: number;
  }>;
};

export const quizRepository = {
  /**
   * Create a new quiz with selected questions
   */
  async create(input: NewQuizInput): Promise<string> {
    return await db.transaction(async (tx) => {
      // Create the quiz
      const [quizResult] = await tx
        .insert(quizzes)
        .values({
          uuid: uuidv4(),
          userId: input.userId,
          numQuestions: input.numQuestions,
          isCompleted: false,
          passPercentage: 80, // Default passing score
          createdAt: new Date(),
        })
        .returning();

      // Add questions to the quiz
      const quizQuestionsToInsert = input.questionIds.map((questionId) => ({
        quizId: quizResult.id,
        questionId,
        createdAt: new Date(),
      }));

      await tx.insert(quizQuestions).values(quizQuestionsToInsert);

      return quizResult.uuid;
    });
  },

  /**
   * Get a quiz by UUID with all its questions and answers
   */
  async getByUuid(uuid: string): Promise<QuizWithQuestions | null> {
    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.uuid, uuid),
      with: {
        quizQuestions: {
          with: {
            question: {
              with: {
                options: true,
              },
            },
          },
        },
        topicPerformance: true,
      },
    });

    if (!quiz) return null;

    return {
      id: quiz.id,
      uuid: quiz.uuid,
      userId: quiz.userId || undefined,
      numQuestions: quiz.numQuestions,
      isCompleted: quiz.isCompleted,
      score: quiz.score || undefined,
      passPercentage: quiz.passPercentage,
      createdAt: quiz.createdAt,
      completedAt: quiz.completedAt || undefined,
      questions: quiz.quizQuestions.map((qq) => ({
        questionId: qq.questionId,
        question: {
          id: qq.question.id,
          uuid: qq.question.uuid,
          question: qq.question.question,
          explanation: qq.question.explanation,
          topic: qq.question.topic,
          difficulty: qq.question.difficulty,
          options: qq.question.options.map((o) => ({
            id: o.id,
            text: o.text,
            isCorrect: o.isCorrect,
          })),
        },
        userAnswer: qq.userAnswer || undefined,
        isCorrect: qq.isCorrect !== null ? qq.isCorrect : undefined,
      })),
      topicPerformance: quiz.topicPerformance.map((tp) => ({
        topic: tp.topic,
        correct: tp.correct,
        total: tp.total,
        percentage: tp.percentage,
      })),
    };
  },

  /**
   * Answer a question in a quiz
   */
  async answerQuestion(input: QuizAnswerInput): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Get the quiz
      const quiz = await tx.query.quizzes.findFirst({
        where: eq(quizzes.uuid, input.quizId),
      });

      if (!quiz || quiz.isCompleted) {
        throw new Error("Quiz not found or already completed");
      }

      // Get the option to check if it's correct
      const option = await tx.query.options.findFirst({
        where: eq(options.id, input.optionId),
      });

      if (!option) {
        throw new Error("Option not found");
      }

      // Update the quiz question
      const result = await tx
        .update(quizQuestions)
        .set({
          userAnswer: input.optionId,
          isCorrect: option.isCorrect,
        })
        .where(
          and(
            eq(quizQuestions.quizId, quiz.id),
            eq(quizQuestions.questionId, input.questionId)
          )
        )
        .returning();

      return result.length > 0;
    });
  },

  /**
   * Complete a quiz and calculate results
   */
  async completeQuiz(quizId: string): Promise<QuizCompletionResult> {
    return await db.transaction(async (tx) => {
      // Get the quiz with questions and answers
      const quiz = await tx.query.quizzes.findFirst({
        where: eq(quizzes.uuid, quizId),
        with: {
          quizQuestions: {
            with: {
              question: true,
            },
          },
        },
      });

      if (!quiz) {
        throw new Error("Quiz not found");
      }

      if (quiz.isCompleted) {
        throw new Error("Quiz already completed");
      }

      // Check if all questions have been answered
      const unansweredQuestions = quiz.quizQuestions.filter(
        (q) => q.userAnswer === null
      );
      if (unansweredQuestions.length > 0) {
        throw new Error(
          `${unansweredQuestions.length} questions are still unanswered`
        );
      }

      // Calculate score
      const totalQuestions = quiz.quizQuestions.length;
      const correctAnswers = quiz.quizQuestions.filter(
        (q) => q.isCorrect
      ).length;
      const scorePercentage = Math.round(
        (correctAnswers / totalQuestions) * 100
      );
      const passed = scorePercentage >= quiz.passPercentage;

      // Calculate topic performance
      const topicResults: Record<string, { correct: number; total: number }> =
        {};

      for (const quizQuestion of quiz.quizQuestions) {
        const topic = quizQuestion.question.topic;

        if (!topicResults[topic]) {
          topicResults[topic] = { correct: 0, total: 0 };
        }

        topicResults[topic].total += 1;
        if (quizQuestion.isCorrect) {
          topicResults[topic].correct += 1;
        }
      }

      const topicPerformanceData = Object.entries(topicResults).map(
        ([topic, data]) => {
          const percentage = Math.round((data.correct / data.total) * 100);
          return {
            topic,
            correct: data.correct,
            total: data.total,
            percentage,
          };
        }
      );

      // Update the quiz as completed
      await tx
        .update(quizzes)
        .set({
          isCompleted: true,
          score: scorePercentage,
          completedAt: new Date(),
        })
        .where(eq(quizzes.id, quiz.id));

      // Save topic performance
      const topicPerformanceToInsert = topicPerformanceData.map((tp) => ({
        quizId: quiz.id,
        topic: tp.topic as any,
        correct: tp.correct,
        total: tp.total,
        percentage: tp.percentage,
        createdAt: new Date(),
      }));

      await tx.insert(topicPerformance).values(topicPerformanceToInsert);

      return {
        quizId,
        totalQuestions,
        correctAnswers,
        score: scorePercentage,
        passed,
        topicPerformance: topicPerformanceData,
      };
    });
  },

  /**
   * Get quiz history for a user
   */
  async getQuizHistory(
    userId: string,
    limit: number = 10
  ): Promise<
    Array<{
      uuid: string;
      createdAt: Date;
      completedAt?: Date;
      score?: number;
      passed?: boolean;
    }>
  > {
    const result = await db
      .select({
        uuid: quizzes.uuid,
        createdAt: quizzes.createdAt,
        completedAt: quizzes.completedAt,
        score: quizzes.score,
        passPercentage: quizzes.passPercentage,
      })
      .from(quizzes)
      .where(eq(quizzes.userId, userId))
      .orderBy(desc(quizzes.createdAt))
      .limit(limit);

    return result.map((quiz) => ({
      uuid: quiz.uuid,
      createdAt: quiz.createdAt,
      completedAt: quiz.completedAt || undefined,
      score: quiz.score || undefined,
      passed:
        quiz.score !== null ? quiz.score >= quiz.passPercentage : undefined,
    }));
  },

  /**
   * Get the number of quizzes taken
   */
  async getTotalQuizCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(quizzes);
    return Number(result.count);
  },

  /**
   * Get quiz statistics
   */
  async getQuizStatistics(): Promise<{
    totalQuizzes: number;
    completedQuizzes: number;
    averageScore: number;
    passRate: number;
  }> {
    // Total quizzes
    const [totalResult] = await db.select({ count: count() }).from(quizzes);
    const totalQuizzes = Number(totalResult.count);

    // Completed quizzes
    const [completedResult] = await db
      .select({ count: count() })
      .from(quizzes)
      .where(eq(quizzes.isCompleted, true));
    const completedQuizzes = Number(completedResult.count);

    // Average score
    const [avgScoreResult] = await db
      .select({
        avg: sql`AVG(${quizzes.score})`,
      })
      .from(quizzes)
      .where(eq(quizzes.isCompleted, true));
    const averageScore = Number(avgScoreResult.avg) || 0;

    // Pass rate
    const [passCountResult] = await db
      .select({ count: count() })
      .from(quizzes)
      .where(
        and(
          eq(quizzes.isCompleted, true),
          sql`${quizzes.score} >= ${quizzes.passPercentage}`
        )
      );
    const passCount = Number(passCountResult.count);
    const passRate =
      completedQuizzes > 0 ? (passCount / completedQuizzes) * 100 : 0;

    return {
      totalQuizzes,
      completedQuizzes,
      averageScore,
      passRate,
    };
  },
};

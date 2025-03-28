// TODO: Refactor this file to properly define types for Drizzle ORM queries
// - Update Drizzle ORM to latest version
// - Define proper relations in schema (one-to-many between quiz and questions)
// - Use proper type definitions for query results
// - Remove the need for type assertions by using the relations API
// db/repositories/quizRepository.ts
import { eq, and, desc, sql, count, inArray } from "drizzle-orm";
import { db } from "../index";
import {
  quizzes,
  quizQuestions,
  topicPerformance,
  questions,
  options,
} from "../schema";
import { nanoid } from "nanoid";
import { QuestionWithOptions } from "./question.repository";

// Define proper interfaces for the query results
interface QuizResult {
  id: string;
  userId: string | null;
  numQuestions: number;
  isCompleted: boolean;
  score: number | null;
  passPercentage: number;
  createdAt: Date;
  completedAt: Date | null;
}

interface QuizQuestionResult {
  questionId: string;
  quizId: string;
  userAnswer: number | null;
  isCorrect: boolean | null;
  question: {
    id: string;
    question: string;
    explanation: string;
    topic: string;
    difficulty: string;
    source: string;
  };
}

interface OptionResult {
  id: number;
  questionId: string;
  text: string;
  isCorrect: boolean;
}

interface TopicPerformanceResult {
  topic: string;
  correct: number;
  total: number;
  percentage: number;
}

export type QuizWithQuestions = {
  id: string;
  userId?: string;
  numQuestions: number;
  isCompleted: boolean;
  score?: number;
  passPercentage: number;
  createdAt: Date;
  completedAt?: Date;
  questions: Array<{
    questionId: string;
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
  userId?: string | null;
  numQuestions: number;
  questionIds: string[];
};

export type QuizAnswerInput = {
  quizId: string;
  questionId: string;
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
  async create(input: NewQuizInput): Promise<QuizWithQuestions> {
    const quizId = nanoid();
    const now = new Date();

    const [quiz] = await db
      .insert(quizzes)
      .values({
        id: quizId,
        userId: input.userId || null,
        createdAt: now,
        numQuestions: input.numQuestions,
        passPercentage: 70,
      })
      .returning();

    const quizQuestionsToInsert = input.questionIds.map((questionId) => ({
      quizId: quiz.id,
      questionId,
      createdAt: new Date(),
    }));

    await db.insert(quizQuestions).values(quizQuestionsToInsert);

    return {
      id: quiz.id,
      userId: quiz.userId || undefined,
      numQuestions: quiz.numQuestions,
      isCompleted: quiz.isCompleted,
      score: quiz.score || undefined,
      passPercentage: quiz.passPercentage,
      createdAt: quiz.createdAt,
      completedAt: quiz.completedAt || undefined,
      questions: [],
      topicPerformance: [],
    };
  },

  /**
   * Get a quiz by ID
   */
  async getById(id: string): Promise<QuizWithQuestions | null> {
    // Cast db.query to access the tables while preserving type safety
    const dbQuery = db.query as unknown as {
      quizzes: { findFirst: (opts: any) => Promise<QuizResult | undefined> };
      quizQuestions: { findMany: (opts: any) => Promise<QuizQuestionResult[]> };
      options: { findMany: (opts: any) => Promise<OptionResult[]> };
      topicPerformance: {
        findMany: (opts: any) => Promise<TopicPerformanceResult[]>;
      };
    };

    const quizResult = await dbQuery.quizzes.findFirst({
      where: eq(quizzes.id, id),
    });

    if (!quizResult) {
      return null;
    }

    const quizQuestionsList = await dbQuery.quizQuestions.findMany({
      where: eq(quizQuestions.quizId, quizResult.id),
      with: {
        question: true,
      },
    });

    const questionIds = quizQuestionsList.map(
      (qq: QuizQuestionResult) => qq.questionId
    );
    const allOptions = await dbQuery.options.findMany({
      where:
        questionIds.length > 0
          ? inArray(options.questionId, questionIds)
          : undefined,
    });

    // Fetch topic performance data for this quiz
    const topicPerformanceData = await dbQuery.topicPerformance.findMany({
      where: eq(topicPerformance.quizId, quizResult.id),
    });

    const questionsWithOptions = quizQuestionsList.map(
      (qq: QuizQuestionResult) => {
        const questionOptions = allOptions.filter(
          (opt: OptionResult) => opt.questionId === qq.questionId
        );

        return {
          questionId: qq.questionId,
          question: {
            id: parseInt(qq.question.id) || 0,
            question: qq.question.question,
            explanation: qq.question.explanation,
            topic: qq.question.topic,
            difficulty: qq.question.difficulty,
            source: qq.question.source,
            options: questionOptions.map((o: OptionResult) => ({
              id: o.id,
              text: o.text,
              isCorrect: o.isCorrect,
            })),
          },
          userAnswer: qq.userAnswer || undefined,
          isCorrect: qq.isCorrect || undefined,
        };
      }
    );

    return {
      id: quizResult.id,
      userId: quizResult.userId || undefined,
      numQuestions: quizResult.numQuestions,
      isCompleted: quizResult.isCompleted,
      score: quizResult.score || undefined,
      passPercentage: quizResult.passPercentage,
      createdAt: quizResult.createdAt,
      completedAt: quizResult.completedAt || undefined,
      questions: questionsWithOptions,
      topicPerformance: topicPerformanceData || [],
    };
  },

  /**
   * Answer a question in a quiz
   */
  async answerQuestion(input: QuizAnswerInput): Promise<boolean> {
    return await db.transaction(async (tx) => {
      const quiz = await (tx.query as any).quizzes.findFirst({
        where: eq(quizzes.id, input.quizId),
      });

      if (!quiz || quiz.isCompleted) {
        throw new Error("Quiz not found or already completed");
      }

      const option = await (tx.query as any).options.findFirst({
        where: eq(options.id, input.optionId),
      });

      if (!option) {
        throw new Error("Option not found");
      }

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
  async completeQuiz(
    quizId: string,
    score: number,
    topicPerformanceData: Array<{
      topic: string;
      correct: number;
      total: number;
      percentage: number;
    }>
  ): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .update(quizzes)
        .set({
          isCompleted: true,
          score,
          completedAt: new Date(),
        })
        .where(eq(quizzes.id, quizId));

      // Save topic performance data
      const validTopics = [
        "Products",
        "Architecture",
        "Lifecycle",
        "Widgets",
        "Assets",
        "Transformations",
        "Management",
        "Access",
      ];

      // Insert valid topic performance records
      for (const tp of topicPerformanceData) {
        if (validTopics.includes(tp.topic)) {
          await tx.insert(topicPerformance).values({
            quizId,
            topic: tp.topic as any,
            correct: tp.correct,
            total: tp.total,
            percentage: tp.percentage,
            createdAt: new Date(),
          });
        }
      }
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
      id: string;
      createdAt: Date;
      completedAt?: Date;
      score?: number;
      passed?: boolean;
    }>
  > {
    const quizzesData = await (db.query as any).quizzes.findMany({
      where: eq(quizzes.userId, userId),
      orderBy: [desc(quizzes.createdAt)],
      limit: limit,
    });

    return quizzesData.map((quiz: any) => ({
      id: quiz.id,
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
    const allQuizzes = await (db.query as any).quizzes.findMany();
    return allQuizzes.length;
  },

  /**
   * Get quiz statistics
   */
  async getQuizStats(userId: string): Promise<{
    totalQuizzes: number;
    completedQuizzes: number;
    averageScore: number | null;
    passRate: number | null;
  }> {
    const userQuizzes = await (db.query as any).quizzes.findMany({
      where: eq(quizzes.userId, userId),
    });

    const totalQuizzes = userQuizzes.length;
    const completedQuizzes = userQuizzes.filter(
      (q: any) => q.completedAt !== null
    ).length;

    let totalScore = 0;
    let passCount = 0;
    let completedCount = 0;

    for (const quiz of userQuizzes) {
      if (quiz.completedAt !== null) {
        completedCount++;
        if (quiz.score !== null) {
          totalScore += quiz.score;
          if (quiz.score >= quiz.passPercentage) {
            passCount++;
          }
        }
      }
    }

    const averageScore =
      completedCount > 0 ? totalScore / completedCount : null;
    const passRate =
      completedCount > 0 ? (passCount / completedCount) * 100 : null;

    return {
      totalQuizzes,
      completedQuizzes,
      averageScore,
      passRate,
    };
  },

  async updateQuizAnswer(
    quizId: string,
    questionId: string,
    userAnswer: number | null,
    isCorrect: boolean
  ): Promise<void> {
    try {
      // First, find the quiz_question record using the question's ID
      const questionRecords = await db.query.questions.findMany({
        where: eq(questions.id, questionId),
        columns: {
          id: true,
        },
      });

      if (!questionRecords || questionRecords.length === 0) {
        throw new Error(`Question with ID ${questionId} not found`);
      }

      const questionInternalId = questionRecords[0].id;

      // Safely convert user answer to number or null
      let finalUserAnswer: number | null = null;

      if (userAnswer !== null) {
        try {
          if (typeof userAnswer === "number") {
            finalUserAnswer = userAnswer;
          } else {
            const parsed = Number(userAnswer);
            if (!isNaN(parsed) && parsed > 0) {
              finalUserAnswer = parsed;
            } else {
              finalUserAnswer = null;
            }
          }
        } catch (e) {
          // Conversion failed, keep as null
        }
      }

      // Update the quiz_questions record using the internal question ID
      await db
        .update(quizQuestions)
        .set({
          userAnswer: finalUserAnswer,
          isCorrect,
        })
        .where(
          and(
            eq(quizQuestions.quizId, quizId),
            eq(quizQuestions.questionId, questionInternalId)
          )
        );
    } catch (error) {
      console.error(`Error saving answer for question ${questionId}:`, error);
      throw error;
    }
  },

  async getTopicPerformance(userId: string): Promise<
    Array<{
      topic: string;
      correct: number;
      total: number;
      percentage: number;
    }>
  > {
    // Cast db.query to access the tables while preserving type safety
    const dbQuery = db.query as unknown as {
      quizzes: { findMany: (opts: any) => Promise<QuizResult[]> };
      topicPerformance: {
        findMany: (opts: any) => Promise<TopicPerformanceResult[]>;
      };
    };

    const userQuizzes = await dbQuery.quizzes.findMany({
      where: eq(quizzes.userId, userId),
    });

    const quizIds = userQuizzes.map((q: QuizResult) => q.id);

    const performanceData = await dbQuery.topicPerformance.findMany({
      where:
        quizIds.length > 0
          ? inArray(topicPerformance.quizId, quizIds)
          : undefined,
    });

    const topicMap: Record<
      string,
      { correct: number; total: number; percentages: number[] }
    > = {};

    for (const perf of performanceData) {
      if (!topicMap[perf.topic]) {
        topicMap[perf.topic] = { correct: 0, total: 0, percentages: [] };
      }

      topicMap[perf.topic].correct += perf.correct;
      topicMap[perf.topic].total += perf.total;
      topicMap[perf.topic].percentages.push(perf.percentage);
    }

    return Object.entries(topicMap).map(([topic, data]) => ({
      topic,
      correct: data.correct,
      total: data.total,
      percentage: Math.round(
        data.percentages.reduce((sum, p) => sum + p, 0) /
          data.percentages.length
      ),
    }));
  },

  async getQuizzesByTopic(
    userId: string,
    topic: string
  ): Promise<
    Array<{
      id: string;
      createdAt: Date;
      completedAt?: Date;
      score?: number;
      passed?: boolean;
    }>
  > {
    const questionsWithTopic = await db.query.questions.findMany({
      where: eq(questions.topic, topic),
      columns: {
        id: true,
      },
    });

    const questionIds = questionsWithTopic.map((q) => q.id);

    const quizQuestionEntries = await db.query.quizQuestions.findMany({
      where:
        questionIds.length > 0
          ? inArray(quizQuestions.questionId, questionIds)
          : undefined,
      columns: {
        quizId: true,
      },
    });

    const quizIds = [...new Set(quizQuestionEntries.map((qq) => qq.quizId))];

    const quizResults = await db.query.quizzes.findMany({
      where: and(
        eq(quizzes.userId, userId),
        quizIds.length > 0 ? inArray(quizzes.id, quizIds) : undefined
      ),
      orderBy: [desc(quizzes.createdAt)],
    });

    return quizResults.map((quiz) => ({
      id: quiz.id,
      createdAt: quiz.createdAt,
      completedAt: quiz.completedAt || undefined,
      score: quiz.score || undefined,
      passed:
        quiz.score !== null ? quiz.score >= quiz.passPercentage : undefined,
    }));
  },

  async getQuizzesByDifficulty(
    userId: string,
    difficulty: string
  ): Promise<
    Array<{
      id: string;
      createdAt: Date;
      completedAt?: Date;
      score?: number;
      passed?: boolean;
    }>
  > {
    const questionsWithDifficulty = await db.query.questions.findMany({
      where: eq(questions.difficulty, difficulty),
      columns: {
        id: true,
      },
    });

    const questionIds = questionsWithDifficulty.map((q) => q.id);

    const quizQuestionEntries = await db.query.quizQuestions.findMany({
      where:
        questionIds.length > 0
          ? inArray(quizQuestions.questionId, questionIds)
          : undefined,
      columns: {
        quizId: true,
      },
    });

    const quizIds = [...new Set(quizQuestionEntries.map((qq) => qq.quizId))];

    const quizResults = await db.query.quizzes.findMany({
      where: and(
        eq(quizzes.userId, userId),
        quizIds.length > 0 ? inArray(quizzes.id, quizIds) : undefined
      ),
      orderBy: [desc(quizzes.createdAt)],
    });

    return quizResults.map((quiz) => ({
      id: quiz.id,
      createdAt: quiz.createdAt,
      completedAt: quiz.completedAt || undefined,
      score: quiz.score || undefined,
      passed:
        quiz.score !== null ? quiz.score >= quiz.passPercentage : undefined,
    }));
  },

  /**
   * Get an option by its ID
   */
  async getOptionById(optionId: number): Promise<OptionResult | null> {
    try {
      const result = await db
        .select()
        .from(options)
        .where(eq(options.id, optionId))
        .limit(1);

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error(`Error fetching option with ID ${optionId}:`, error);
      return null;
    }
  },
};

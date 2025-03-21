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
  userId?: string | null;
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
  async create(input: NewQuizInput): Promise<QuizWithQuestions> {
    const quizUuid = uuidv4();
    const now = new Date();

    const [quiz] = await db
      .insert(quizzes)
      .values({
        uuid: quizUuid,
        userId: input.userId || null,
        createdAt: now,
        numQuestions: input.numQuestions,
        passPercentage: 70,
      })
      .returning();

    await db.insert(quizQuestions).values(
      input.questionIds.map((questionId) => ({
        quizId: quiz.id,
        questionId,
        createdAt: new Date(),
      }))
    );

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
      questions: [],
      topicPerformance: [],
    };
  },

  /**
   * Get a quiz by UUID with all its questions and answers
   */
  async getByUuid(uuid: string): Promise<QuizWithQuestions | null> {
    const quiz = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.uuid, uuid))
      .limit(1)
      .then((rows) => rows[0] || null);

    if (!quiz) {
      return null;
    }

    const quizQuestionsList = await db
      .select({
        questionId: quizQuestions.questionId,
        question: {
          id: questions.id,
          uuid: questions.uuid,
          question: questions.question,
          explanation: questions.explanation,
          topic: questions.topic,
          difficulty: questions.difficulty,
        },
        userAnswer: quizQuestions.userAnswer,
        isCorrect: quizQuestions.isCorrect,
      })
      .from(quizQuestions)
      .innerJoin(questions, eq(questions.id, quizQuestions.questionId))
      .where(eq(quizQuestions.quizId, quiz.id));

    // Get options for each question
    const questionIds = quizQuestionsList.map((q) => q.question.id);
    const questionOptions = await db
      .select()
      .from(options)
      .where(inArray(options.questionId, questionIds));

    // Combine questions with their options
    const questionsWithOptions = quizQuestionsList.map((q) => ({
      questionId: q.questionId,
      question: {
        ...q.question,
        options: questionOptions
          .filter((o) => o.questionId === q.question.id)
          .map((o) => ({
            id: o.id,
            text: o.text,
            isCorrect: o.isCorrect,
          })),
      },
      userAnswer: q.userAnswer || undefined,
      isCorrect: q.isCorrect || undefined,
    }));

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
      questions: questionsWithOptions,
      topicPerformance: [],
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
  async completeQuiz(
    quizId: number,
    score: number,
    topicPerformanceData: Array<{
      topic: string;
      correct: number;
      total: number;
      percentage: number;
    }>
  ): Promise<void> {
    await db.transaction(async (tx) => {
      // Update quiz completion status and score
      await tx
        .update(quizzes)
        .set({
          isCompleted: true,
          score,
          completedAt: new Date(),
        })
        .where(eq(quizzes.id, quizId));

      // Insert topic performance records
      await tx.insert(topicPerformance).values(
        topicPerformanceData.map((tp) => ({
          quizId,
          topic: tp.topic as any, // Cast to match the enum type
          correct: tp.correct,
          total: tp.total,
          percentage: tp.percentage,
          createdAt: new Date(),
        }))
      );
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
  async getQuizStats(userId: string): Promise<{
    totalQuizzes: number;
    completedQuizzes: number;
    averageScore: number | null;
    passRate: number | null;
  }> {
    const [result] = await db
      .select({
        totalQuizzes: count(),
        completedQuizzes: count(quizzes.completedAt),
        averageScore: sql<
          number | null
        >`AVG(CASE WHEN ${quizzes.completedAt} IS NOT NULL THEN ${quizzes.score} END)`,
        passRate: sql<
          number | null
        >`AVG(CASE WHEN ${quizzes.completedAt} IS NOT NULL THEN CASE WHEN ${quizzes.score} >= ${quizzes.passPercentage} THEN 100 ELSE 0 END END)`,
      })
      .from(quizzes)
      .where(eq(quizzes.userId, userId));

    return {
      totalQuizzes: Number(result.totalQuizzes),
      completedQuizzes: Number(result.completedQuizzes),
      averageScore: result.averageScore,
      passRate: result.passRate,
    };
  },

  /**
   * Get a quiz by ID with all its questions and answers
   */
  async getById(id: number): Promise<QuizWithQuestions | null> {
    const quiz = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, id))
      .limit(1)
      .then((rows) => rows[0] || null);

    if (!quiz) {
      return null;
    }

    const quizQuestionsList = await db
      .select({
        questionId: quizQuestions.questionId,
        question: {
          id: questions.id,
          uuid: questions.uuid,
          question: questions.question,
          explanation: questions.explanation,
          topic: questions.topic,
          difficulty: questions.difficulty,
        },
        userAnswer: quizQuestions.userAnswer,
        isCorrect: quizQuestions.isCorrect,
      })
      .from(quizQuestions)
      .innerJoin(questions, eq(questions.id, quizQuestions.questionId))
      .where(eq(quizQuestions.quizId, id));

    // Get options for each question
    const questionIds = quizQuestionsList.map((q) => q.question.id);
    const questionOptions = await db
      .select()
      .from(options)
      .where(inArray(options.questionId, questionIds));

    // Combine questions with their options
    const questionsWithOptions = quizQuestionsList.map((q) => ({
      questionId: q.questionId,
      question: {
        ...q.question,
        options: questionOptions
          .filter((o) => o.questionId === q.question.id)
          .map((o) => ({
            id: o.id,
            text: o.text,
            isCorrect: o.isCorrect,
          })),
      },
      userAnswer: q.userAnswer || undefined,
      isCorrect: q.isCorrect || undefined,
    }));

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
      questions: questionsWithOptions,
      topicPerformance: [],
    };
  },

  async updateQuizAnswer(
    quizId: number,
    questionId: number,
    userAnswer: number,
    isCorrect: boolean
  ): Promise<void> {
    await db
      .update(quizQuestions)
      .set({
        userAnswer,
        isCorrect,
      })
      .where(
        and(
          eq(quizQuestions.quizId, quizId),
          eq(quizQuestions.questionId, questionId)
        )
      );
  },

  async getTopicPerformance(userId: string): Promise<
    Array<{
      topic: string;
      correct: number;
      total: number;
      percentage: number;
    }>
  > {
    const result = await db
      .select({
        topic: topicPerformance.topic,
        correct: sql<number>`SUM(${topicPerformance.correct})`,
        total: sql<number>`SUM(${topicPerformance.total})`,
        percentage: sql<number>`ROUND(AVG(${topicPerformance.percentage}))`,
      })
      .from(topicPerformance)
      .innerJoin(quizzes, eq(quizzes.id, topicPerformance.quizId))
      .where(eq(quizzes.userId, userId))
      .groupBy(topicPerformance.topic);

    return result.map((tp) => ({
      topic: tp.topic,
      correct: Number(tp.correct),
      total: Number(tp.total),
      percentage: Number(tp.percentage),
    }));
  },

  async getQuizzesByTopic(
    userId: string,
    topic: string
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
      .innerJoin(quizQuestions, eq(quizzes.id, quizQuestions.quizId))
      .innerJoin(questions, eq(quizQuestions.questionId, questions.id))
      .where(and(eq(quizzes.userId, userId), eq(questions.topic, topic as any)))
      .orderBy(desc(quizzes.createdAt));

    return result.map((quiz) => ({
      uuid: quiz.uuid,
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
      .innerJoin(quizQuestions, eq(quizzes.id, quizQuestions.quizId))
      .innerJoin(questions, eq(quizQuestions.questionId, questions.id))
      .where(
        and(
          eq(quizzes.userId, userId),
          eq(questions.difficulty, difficulty as any)
        )
      )
      .orderBy(desc(quizzes.createdAt));

    return result.map((quiz) => ({
      uuid: quiz.uuid,
      createdAt: quiz.createdAt,
      completedAt: quiz.completedAt || undefined,
      score: quiz.score || undefined,
      passed:
        quiz.score !== null ? quiz.score >= quiz.passPercentage : undefined,
    }));
  },
};

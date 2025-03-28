// TODO: Refactor this file to properly define types for Drizzle ORM queries
// - Update Drizzle ORM to latest version
// - Define proper relations in schema
// - Use proper type definitions for query results
import { eq, and, inArray } from "drizzle-orm";
import { db } from "../index";
import {
  users,
  quizzes,
  topicPerformance,
  userTopicPerformance,
  topicEnum,
  User,
  Quiz,
} from "../schema";
import { nanoid } from "nanoid";

export type UserProfile = {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  isAnonymous: boolean;
  createdAt: Date;
  quizStats: {
    totalQuizzes: number;
    completedQuizzes: number;
    averageScore: number;
    passRate: number;
  };
  topicPerformance: Array<{
    topic: string;
    totalQuizzes: number;
    totalQuestions: number;
    correctAnswers: number;
    percentage: number;
  }>;
};

// Define type for quiz with minimal properties we need
interface QuizWithScore {
  id: string;
  isCompleted: boolean;
  score: number | null;
  passPercentage: number;
}

// Define type for topic performance stats
interface TopicStat {
  id: number;
  topic: string;
  total: number;
  correct: number;
  percentage: number;
  totalQuizzes: number;
  totalQuestions: number;
  correctAnswers: number;
}

export const userRepository = {
  /**
   * Create a new user (anonymous or authenticated)
   */
  async create(data: {
    email?: string;
    name?: string;
    avatarUrl?: string;
    isAnonymous?: boolean;
  }): Promise<string> {
    const [user] = await db
      .insert(users)
      .values({
        id: nanoid(),
        email: data.email,
        name: data.name,
        avatarUrl: data.avatarUrl,
        isAnonymous: data.isAnonymous ?? !data.email,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      })
      .returning();

    return user.id;
  },

  /**
   * Get a user by ID
   */
  async getById(id: string): Promise<UserProfile | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) return null;

    // Get quiz statistics
    const userQuizzes = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.userId, user.id));

    const completedQuizzes = userQuizzes.filter(
      (quiz: QuizWithScore) => quiz.isCompleted
    );
    const passedQuizzes = completedQuizzes.filter(
      (quiz: QuizWithScore) =>
        quiz.score !== null && quiz.score >= quiz.passPercentage
    );

    // Get topic performance
    const userTopicStats = await db
      .select()
      .from(userTopicPerformance)
      .where(eq(userTopicPerformance.userId, user.id));

    return {
      id: user.id,
      email: user.email || undefined,
      name: user.name || undefined,
      avatarUrl: user.avatarUrl || undefined,
      isAnonymous: user.isAnonymous,
      createdAt: user.createdAt,
      quizStats: {
        totalQuizzes: userQuizzes.length,
        completedQuizzes: completedQuizzes.length,
        averageScore:
          completedQuizzes.length > 0
            ? completedQuizzes.reduce(
                (sum: number, quiz: QuizWithScore) => sum + (quiz.score || 0),
                0
              ) / completedQuizzes.length
            : 0,
        passRate:
          completedQuizzes.length > 0
            ? (passedQuizzes.length / completedQuizzes.length) * 100
            : 0,
      },
      topicPerformance: userTopicStats.map((stat: TopicStat) => ({
        topic: stat.topic,
        totalQuizzes: stat.totalQuizzes,
        totalQuestions: stat.totalQuestions,
        correctAnswers: stat.correctAnswers,
        percentage: stat.percentage,
      })),
    };
  },

  /**
   * Get a user by email
   */
  async getByEmail(email: string): Promise<{ id: string } | null> {
    const results = await db
      .select({
        id: users.id,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return results.length > 0 ? results[0] : null;
  },

  /**
   * Update user info
   */
  async update(
    id: string,
    data: {
      email?: string;
      name?: string;
      avatarUrl?: string;
      isAnonymous?: boolean;
    }
  ): Promise<boolean> {
    const result = await db
      .update(users)
      .set({
        ...data,
        lastLoginAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return result.length > 0;
  },

  /**
   * Update user topic performance based on a completed quiz
   */
  async updateTopicPerformance(
    userId: string,
    quizId: string,
    tx = db
  ): Promise<void> {
    try {
      const quizTopicStats = await tx
        .select()
        .from(topicPerformance)
        .where(eq(topicPerformance.quizId, quizId));

      if (!quizTopicStats.length) return;

      // Prepare all updates/inserts in arrays
      const updates: any[] = [];
      const inserts: any[] = [];

      // Get all existing stats in one query
      const existingStats = await tx
        .select()
        .from(userTopicPerformance)
        .where(
          and(
            eq(userTopicPerformance.userId, userId),
            inArray(
              userTopicPerformance.topic,
              quizTopicStats.map((stat: TopicStat) => stat.topic)
            )
          )
        );

      // Create a lookup map for existing stats
      const existingStatsMap = new Map(
        existingStats.map((stat: TopicStat) => [stat.topic, stat])
      );

      // Process all topics at once
      for (const topicStat of quizTopicStats) {
        const existing = existingStatsMap.get(topicStat.topic) as
          | TopicStat
          | undefined;

        if (existing) {
          updates.push({
            id: existing.id,
            totalQuizzes: existing.totalQuizzes + 1,
            totalQuestions: existing.totalQuestions + topicStat.total,
            correctAnswers: existing.correctAnswers + topicStat.correct,
            percentage: Math.round(
              ((existing.correctAnswers + topicStat.correct) /
                (existing.totalQuestions + topicStat.total)) *
                100
            ),
            updatedAt: new Date(),
          });
        } else {
          inserts.push({
            userId,
            topic: topicStat.topic,
            totalQuizzes: 1,
            totalQuestions: topicStat.total,
            correctAnswers: topicStat.correct,
            percentage: topicStat.percentage,
            updatedAt: new Date(),
          });
        }
      }

      // Perform all updates and inserts in parallel
      await Promise.all([
        updates.length > 0
          ? Promise.all(
              updates.map((update) =>
                tx
                  .update(userTopicPerformance)
                  .set(update)
                  .where(eq(userTopicPerformance.id, update.id))
              )
            )
          : Promise.resolve(),
        inserts.length > 0
          ? tx.insert(userTopicPerformance).values(inserts)
          : Promise.resolve(),
      ]);
    } catch (error) {
      console.error("Error in updateTopicPerformance:", error);
      throw error;
    }
  },

  /**
   * Get all available topics with user's performance
   */
  async getUserTopics(userId: string): Promise<
    Array<{
      topic: string;
      percentage: number;
      totalQuestions: number;
    }>
  > {
    // Get the user's performance data
    const userPerformance = await db
      .select()
      .from(userTopicPerformance)
      .where(eq(userTopicPerformance.userId, userId));

    // Map all available topics, including ones the user hasn't attempted
    const allTopics = Object.values(topicEnum.enumValues);

    return allTopics.map((topic) => {
      const topicData = userPerformance.find(
        (perf: { topic: string }) => perf.topic === topic
      );

      return {
        topic,
        percentage: topicData?.percentage || 0,
        totalQuestions: topicData?.totalQuestions || 0,
      };
    });
  },
};

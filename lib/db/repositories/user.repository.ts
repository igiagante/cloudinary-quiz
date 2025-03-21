// db/repositories/userRepository.ts
import { eq, and, desc, sql, count } from "drizzle-orm";
import { db } from "../index";
import {
  users,
  quizzes,
  topicPerformance,
  userTopicPerformance,
  topicEnum,
} from "../schema";
import { v4 as uuidv4 } from "uuid";

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
        id: uuidv4(),
        uuid: uuidv4(),
        email: data.email,
        name: data.name,
        avatarUrl: data.avatarUrl,
        isAnonymous: data.isAnonymous ?? !data.email,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      })
      .returning({ uuid: users.uuid });

    return user.uuid;
  },

  /**
   * Get a user by UUID
   */
  async getByUuid(uuid: string): Promise<UserProfile | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.uuid, uuid),
    });

    if (!user) return null;

    // Get quiz statistics
    const userQuizzes = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.userId, user.id));

    const completedQuizzes = userQuizzes.filter((quiz) => quiz.isCompleted);
    const passedQuizzes = completedQuizzes.filter(
      (quiz) => quiz.score && quiz.score >= quiz.passPercentage
    );

    // Get topic performance
    const userTopicStats = await db
      .select()
      .from(userTopicPerformance)
      .where(eq(userTopicPerformance.userId, user.id));

    return {
      id: user.uuid,
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
                (sum, quiz) => sum + (quiz.score || 0),
                0
              ) / completedQuizzes.length
            : 0,
        passRate:
          completedQuizzes.length > 0
            ? (passedQuizzes.length / completedQuizzes.length) * 100
            : 0,
      },
      topicPerformance: userTopicStats.map((stat) => ({
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
  async getByEmail(
    email: string
  ): Promise<{ id: string; uuid: string } | null> {
    const user = await db
      .select({
        id: users.id,
        uuid: users.uuid,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user.length > 0 ? user[0] : null;
  },

  /**
   * Update user info
   */
  async update(
    uuid: string,
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
      .where(eq(users.uuid, uuid))
      .returning({ id: users.id });

    return result.length > 0;
  },

  /**
   * Update user topic performance based on a completed quiz
   */
  async updateTopicPerformance(
    userId: string,
    quizId: number,
    tx = db
  ): Promise<void> {
    try {
      const quizTopicStats = await tx
        .select()
        .from(topicPerformance)
        .where(eq(topicPerformance.quizId, quizId));

      if (!quizTopicStats.length) {
        return;
      }

      const userExists = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!userExists.length) {
        throw new Error(`User not found with ID: ${userId}`);
      }

      await tx.transaction(async (tx) => {
        for (const topicStat of quizTopicStats) {
          const existingStats = await tx
            .select()
            .from(userTopicPerformance)
            .where(
              and(
                eq(userTopicPerformance.userId, userId),
                eq(userTopicPerformance.topic, topicStat.topic)
              )
            )
            .limit(1);

          if (existingStats.length > 0) {
            const currentStats = existingStats[0];
            const newStats = {
              totalQuizzes: currentStats.totalQuizzes + 1,
              totalQuestions: currentStats.totalQuestions + topicStat.total,
              correctAnswers: currentStats.correctAnswers + topicStat.correct,
              percentage: Math.round(
                ((currentStats.correctAnswers + topicStat.correct) /
                  (currentStats.totalQuestions + topicStat.total)) *
                  100
              ),
              updatedAt: new Date(),
            };

            await tx
              .update(userTopicPerformance)
              .set(newStats)
              .where(eq(userTopicPerformance.id, currentStats.id));
          } else {
            const newStats = {
              userId,
              topic: topicStat.topic,
              totalQuizzes: 1,
              totalQuestions: topicStat.total,
              correctAnswers: topicStat.correct,
              percentage: topicStat.percentage,
              updatedAt: new Date(),
            };

            await tx.insert(userTopicPerformance).values(newStats);
          }
        }
      });
    } catch (error) {
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
      const topicData = userPerformance.find((perf) => perf.topic === topic);

      return {
        topic,
        percentage: topicData?.percentage || 0,
        totalQuestions: topicData?.totalQuestions || 0,
      };
    });
  },
};

// lib/quiz-report.ts
import { analyzeQuizResults } from "./quiz-generator";
import { QuizQuestion, QuizResults } from "@/types";
import { db } from "@/lib/db";
import {
  quizzes,
  quizQuestions,
  topicPerformance,
  users,
  questions,
  options,
} from "@/lib/db/schema";
import { userRepository } from "@/lib/db/repositories/user.repository";
import { v4 as uuidv4 } from "uuid";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

export async function generateQuizReport(
  quizQuestionsList: QuizQuestion[],
  userAnswers: Record<string, string>,
  userId?: string // Optional user ID for tracking
): Promise<QuizResults & { quizId: string }> {
  const results = analyzeQuizResults(quizQuestionsList, userAnswers);

  try {
    return await db.transaction(async (tx) => {
      let dbUserId: string | undefined;

      if (userId) {
        // Find user by UUID
        const userResult = await tx
          .select({
            id: users.id,
            uuid: users.uuid,
          })
          .from(users)
          .where(eq(users.uuid, userId))
          .limit(1);

        if (userResult.length > 0) {
          dbUserId = userResult[0].id;
        } else {
          // Create a new anonymous user
          const [newUser] = await tx
            .insert(users)
            .values({
              id: uuidv4(), // Generate a new ID
              uuid: userId, // Use the provided userId as UUID
              isAnonymous: true,
              createdAt: new Date(),
              lastLoginAt: new Date(),
            })
            .returning();

          dbUserId = newUser.id; // Use the new ID for database relations
        }
      }

      // 2. Create the quiz
      const [quiz] = await tx
        .insert(quizzes)
        .values({
          uuid: uuidv4(),
          userId: dbUserId,
          numQuestions: quizQuestionsList.length,
          isCompleted: true,
          score: Math.round(results.score.percentage),
          passPercentage: 80,
          createdAt: new Date(),
          completedAt: new Date(),
        })
        .returning();

      // 3. Map frontend questions to database format
      const mappedQuestions = await mapFrontendQuizToDb(
        quizQuestionsList,
        userAnswers,
        quiz.uuid
      );

      // 4. Save user answers
      if (mappedQuestions.length > 0) {
        for (const mappedQuestion of mappedQuestions) {
          // First, find the question ID by UUID
          const [dbQuestion] = await tx
            .select({
              id: questions.id,
            })
            .from(questions)
            .where(eq(questions.uuid, mappedQuestion.id))
            .limit(1);

          if (!dbQuestion) {
            continue;
          }

          // Then, find the option ID for the user's answer
          const [userAnswerOption] = await tx
            .select({ id: options.id })
            .from(options)
            .where(
              and(
                eq(options.questionId, dbQuestion.id),
                eq(options.text, mappedQuestion.userAnswer)
              )
            )
            .limit(1);

          await tx.insert(quizQuestions).values({
            quizId: quiz.id,
            questionId: dbQuestion.id,
            userAnswer: userAnswerOption?.id || null,
            isCorrect:
              mappedQuestion.userAnswer === mappedQuestion.correctAnswer,
          });
        }
      }

      // 5. Save topic performance
      if (results.topicPerformance) {
        const topicPerformanceToInsert = Object.entries(
          results.topicPerformance
        )
          .filter(([_, data]) => data && data.total > 0)
          .map(([topic, data]) => ({
            quizId: quiz.id,
            topic: topic as any,
            correct: data.correct,
            total: data.total,
            percentage: Math.round(data.percentage),
            createdAt: new Date(),
          }));

        if (topicPerformanceToInsert.length > 0) {
          await tx
            .insert(topicPerformance)
            .values(topicPerformanceToInsert)
            .returning();
        }
      }

      // 6. Update user topic performance statistics (if user exists)
      if (dbUserId) {
        try {
          const topicStats = await tx
            .select()
            .from(topicPerformance)
            .where(eq(topicPerformance.quizId, quiz.id));

          if (topicStats.length > 0) {
            await userRepository.updateTopicPerformance(dbUserId, quiz.id, tx);
          }
        } catch (error) {
          // Handle error silently
        }
      }

      // Return the results with the quiz ID
      return {
        ...results,
        quizId: quiz.uuid,
        topicBreakdown: results.topicPerformance
          ? Object.entries(results.topicPerformance).map(([topic, data]) => ({
              topic: topic as any,
              ...data,
            }))
          : [],
      };
    });
  } catch (error) {
    // If database saving fails, still return the analysis results
    return {
      ...results,
      quizId: "error-saving",
      topicBreakdown: results.topicPerformance
        ? Object.entries(results.topicPerformance).map(([topic, data]) => ({
            topic: topic as any,
            ...data,
          }))
        : [],
    };
  }
}

async function mapFrontendQuizToDb(
  quizQuestionsList: QuizQuestion[],
  userAnswers: Record<string, string>,
  quizId: string
) {
  const mappedQuestions = [];
  for (const question of quizQuestionsList) {
    const mappedQuestion = {
      id: question.id,
      quizId: quizId,
      question: question.question,
      correctAnswer: question.correctAnswer,
      options: question.options,
      topic: question.topic,
      userAnswer: userAnswers[question.id],
    };
    mappedQuestions.push(mappedQuestion);
  }
  return mappedQuestions;
}

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
import { eq, and, inArray } from "drizzle-orm";

export async function generateQuizReport(
  quizQuestionsList: QuizQuestion[],
  userAnswers: Record<string, string>,
  userId?: string // Optional user ID for tracking
): Promise<QuizResults & { quizId: string }> {
  const analysis = analyzeQuizResults(quizQuestionsList, userAnswers);

  try {
    return await db.transaction(async (tx) => {
      // Run initial queries in parallel
      const [userResult, dbQuestions] = await Promise.all([
        // User lookup
        userId
          ? tx
              .select({ id: users.id, uuid: users.uuid })
              .from(users)
              .where(eq(users.uuid, userId))
              .limit(1)
          : Promise.resolve([]),

        // Questions lookup
        tx
          .select({ id: questions.id, uuid: questions.uuid })
          .from(questions)
          .where(
            inArray(
              questions.uuid,
              quizQuestionsList.map((q) => q.id)
            )
          ),
      ]);

      // Process user and get options in parallel
      const [quiz, allOptions] = await Promise.all([
        // Handle user creation if needed
        tx
          .insert(quizzes)
          .values({
            uuid: uuidv4(),
            userId: userResult[0]?.id,
            numQuestions: quizQuestionsList.length,
            isCompleted: true,
            score: Math.round(analysis.score.percentage),
            passPercentage: 80,
            createdAt: new Date(),
            completedAt: new Date(),
          })
          .returning()
          .then(([quiz]) => quiz),

        // Fetch options
        tx
          .select({
            id: options.id,
            questionId: options.questionId,
            text: options.text,
          })
          .from(options)
          .where(
            inArray(
              options.questionId,
              dbQuestions.map((q) => q.id)
            )
          ),
      ]);

      // 3. Prepare all question mappings in advance
      const mappedQuestions = await mapFrontendQuizToDb(
        quizQuestionsList,
        userAnswers,
        quiz.uuid
      );

      if (mappedQuestions.length > 0) {
        // Create a lookup map for faster access
        const questionLookup = new Map(dbQuestions.map((q) => [q.uuid, q.id]));

        // Create option lookup map for faster access
        const optionLookup = new Map();
        allOptions.forEach((opt) => {
          const key = `${opt.questionId}:${opt.text}`;
          optionLookup.set(key, opt.id);
        });

        // 6. Prepare all quiz questions for batch insert
        const quizQuestionsToInsert = mappedQuestions
          .filter((q) => questionLookup.has(q.id))
          .map((mappedQuestion) => {
            const dbQuestionId = questionLookup.get(mappedQuestion.id);
            if (!dbQuestionId) return null;

            const optionKey = `${dbQuestionId}:${mappedQuestion.userAnswer}`;
            const userAnswerOptionId = optionLookup.get(optionKey) || null;

            return {
              quizId: quiz.id,
              questionId: dbQuestionId,
              userAnswer: userAnswerOptionId,
              isCorrect:
                mappedQuestion.userAnswer === mappedQuestion.correctAnswer,
            };
          })
          .filter((q): q is NonNullable<typeof q> => q !== null);

        // Batch insert all quiz questions at once
        if (quizQuestionsToInsert.length > 0) {
          await tx.insert(quizQuestions).values(quizQuestionsToInsert);
        }
      }

      // 7. Save topic performance (batch insert)
      if (analysis.topicPerformance) {
        const topicPerformanceToInsert = Object.entries(
          analysis.topicPerformance
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
          await tx.insert(topicPerformance).values(topicPerformanceToInsert);
        }
      }

      // 8. Update user topic performance statistics (if user exists)
      if (userResult[0]?.id) {
        // Fire and forget - don't await the update
        void userRepository
          .updateTopicPerformance(userResult[0].id, quiz.id, tx)
          .catch((error) => {
            console.error("Error updating user topic performance:", error);
          });
      }

      // Return the results with the quiz ID
      return {
        ...analysis,
        quizId: quiz.uuid,
        topicBreakdown: analysis.topicPerformance
          ? Object.entries(analysis.topicPerformance).map(([topic, data]) => ({
              topic: topic as any,
              ...data,
            }))
          : [],
      };
    });
  } catch (error) {
    // If database saving fails, still return the analysis results
    return {
      ...analysis,
      quizId: "error-saving",
      topicBreakdown: analysis.topicPerformance
        ? Object.entries(analysis.topicPerformance).map(([topic, data]) => ({
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

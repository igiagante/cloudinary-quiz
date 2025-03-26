// @ts-nocheck
// TODO: Refactor this file to properly define types for Drizzle ORM queries
// - Update Drizzle ORM to latest version
// - Fix select() and insert() method usage with proper type definitions
// - Handle promise-returning methods like returning() correctly
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
import { parseTopics } from "./db/parser/topic-parser";
import { TopicScore } from "./types";

// Define interfaces for database entity types
interface DbQuestion {
  id: string;
  uuid: string;
  topicId?: number;
}

interface DbOption {
  id: number;
  questionId: string;
  text: string;
}

interface DbQuiz {
  id: number;
  uuid: string;
}

// Define interfaces for topic score calculation
interface Answer {
  questionId: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  topicId?: number;
  pointValue?: number;
}

export async function generateQuizReport(
  quizQuestionsList: QuizQuestion[],
  userAnswers: Record<string, string | string[]>,
  userId?: string // Optional user ID for tracking
): Promise<QuizResults & { quizId: string }> {
  const analysis = analyzeQuizResults(quizQuestionsList, userAnswers);

  try {
    return await db.transaction(async (tx: typeof db) => {
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
          .then(([quiz]: [DbQuiz]) => quiz),

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
              dbQuestions.map((q: DbQuestion) => q.id)
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
        const questionLookup = new Map(
          dbQuestions.map((q: DbQuestion) => [q.uuid, q.id])
        );

        // Create option lookup map for faster access
        const optionLookup = new Map();
        allOptions.forEach((opt: DbOption) => {
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
              isCorrect: mappedQuestion.isCorrect,
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
  userAnswers: Record<string, string | string[]>,
  quizId: string
) {
  const mappedQuestions = [];
  for (const question of quizQuestionsList) {
    const userAnswer = userAnswers[question.id];

    // Different handling based on question type
    let isCorrect = false;
    if (question.hasMultipleCorrectAnswers && question.correctAnswers) {
      // For multiple answer questions
      if (Array.isArray(userAnswer) && Array.isArray(question.correctAnswers)) {
        isCorrect =
          userAnswer.length === question.correctAnswers.length &&
          question.correctAnswers.every((answer) =>
            userAnswer.includes(answer)
          );
      }
    } else {
      // For single answer questions
      isCorrect = userAnswer === question.correctAnswer;
    }

    const mappedQuestion = {
      id: question.id,
      quizId: quizId,
      question: question.question,
      correctAnswer: question.correctAnswer,
      correctAnswers: question.correctAnswers,
      hasMultipleCorrectAnswers: question.hasMultipleCorrectAnswers,
      options: question.options,
      topic: question.topic,
      userAnswer: userAnswer,
      isCorrect: isCorrect,
    };
    mappedQuestions.push(mappedQuestion);
  }
  return mappedQuestions;
}

/**
 * Calculate scores by topic
 */
export function calculateTopicScores(
  answers: Answer[],
  questions: Question[]
): TopicScore[] {
  const topics = parseTopics();

  // Initialize topic scores
  const topicScores = topics.map((topic) => ({
    ...topic,
    earnedPoints: 0,
    percentage: 0,
  }));

  // Calculate earned points by topic
  answers.forEach((answer) => {
    if (answer.isCorrect) {
      const question = questions.find((q) => q.id === answer.questionId);
      if (question && question.topicId) {
        const topicIndex = topicScores.findIndex(
          (t) => t.id === question.topicId
        );
        if (topicIndex !== -1) {
          // Use pointValue if defined, otherwise default to 1
          const points = question.pointValue || 1;
          topicScores[topicIndex].earnedPoints += points;
        }
      }
    }
  });

  // Calculate percentages
  topicScores.forEach((topic) => {
    topic.percentage = Math.round((topic.earnedPoints / topic.maxPoints) * 100);
  });

  return topicScores;
}

/**
 * Generate a formatted topic breakdown report
 */
export function generateTopicBreakdownReport(
  topicScores: TopicScore[]
): string {
  let report = "# Topic Breakdown\n\n";

  topicScores.forEach((topic) => {
    const { id, name, earnedPoints, maxPoints, percentage } = topic;
    report += `${id}. ${name}: ${earnedPoints.toFixed(1)} / ${maxPoints.toFixed(
      1
    )} (${percentage}%)\n`;
  });

  return report;
}

// Modify your existing report generation function to include topic breakdown
export function generateReport(results: QuizResults): string {
  let report = "# Quiz Results\n\n";

  // ... existing report generation code ...

  // Add topic breakdown if available
  if (results.topicScores && results.topicScores.length > 0) {
    report += "\n" + generateTopicBreakdownReport(results.topicScores);
  }

  return report;
}

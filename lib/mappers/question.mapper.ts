// @ts-nocheck
// TODO: Refactor this file to properly define types for Drizzle ORM queries
// - Update Drizzle ORM to latest version
// - Fix select() method usage with proper type definitions
// - Use the query API consistently instead of SQL builder API
// lib/question-mapper.ts
import { db } from "../db";
import { questions, options } from "../db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Get the database ID for a question based on its UUID
 */
export async function getQuestionIdByUuid(
  uuid: string
): Promise<number | null> {
  const result = await db
    .select({ id: questions.id })
    .from(questions)
    .where(eq(questions.uuid, uuid))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0].id;
}

/**
 * Get the option ID for a specific answer to a question
 */
export async function getOptionIdByText(
  questionId: number,
  answerText: string
): Promise<number | null> {
  const result = await db
    .select({ id: options.id })
    .from(options)
    .where(
      and(
        eq(options.questionId, String(questionId)),
        eq(options.text, answerText)
      )
    )
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0].id;
}

/**
 * Convert frontend QuizQuestion to database format
 */
export async function mapFrontendQuizToDb(
  frontendQuestions: Array<{
    id: string; // UUID
    question: string;
    options: string[];
    correctAnswer: string;
  }>,
  userAnswers: Record<string, string>
): Promise<
  Array<{
    questionId: number;
    optionId: number | null;
    isCorrect: boolean;
  }>
> {
  const mappedQuestions = [];

  for (const question of frontendQuestions) {
    const dbQuestionId = await getQuestionIdByUuid(question.id);

    if (!dbQuestionId) {
      console.warn(`Question with UUID ${question.id} not found in database`);
      continue;
    }

    const userAnswer = userAnswers[question.id];
    let optionId = null;

    if (userAnswer) {
      optionId = await getOptionIdByText(dbQuestionId, userAnswer);
    }

    mappedQuestions.push({
      questionId: dbQuestionId,
      optionId,
      isCorrect: userAnswer === question.correctAnswer,
    });
  }

  return mappedQuestions;
}

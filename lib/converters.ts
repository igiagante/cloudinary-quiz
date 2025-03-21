// lib/db-converters.ts
import { QuestionWithOptions } from "@/lib/db/repositories/question.repository";
import {
  QuizWithQuestions,
  QuizCompletionResult,
} from "@/lib/db/repositories/quiz.repository";
import { QuizQuestion, QuizResults, TopicPerformance } from "@/types";

/**
 * Convert a database QuestionWithOptions to a frontend QuizQuestion
 */
export function toQuizQuestion(dbQuestion: QuestionWithOptions): QuizQuestion {
  return {
    id: dbQuestion.uuid,
    question: dbQuestion.question,
    options: dbQuestion.options.map((opt) => opt.text),
    correctAnswer: dbQuestion.options.find((opt) => opt.isCorrect)?.text || "",
    explanation: dbQuestion.explanation,
    topic: dbQuestion.topic as any,
    difficulty: dbQuestion.difficulty as any,
  };
}

/**
 * Convert multiple database questions to frontend QuizQuestions
 */
export function toQuizQuestions(
  dbQuestions: QuestionWithOptions[]
): QuizQuestion[] {
  return dbQuestions.map((dbQuestion) => toQuizQuestion(dbQuestion));
}

/**
 * Convert a database QuizWithQuestions to frontend-friendly format
 */
export function toQuizWithQuestions(dbQuiz: QuizWithQuestions): {
  id: string;
  questions: QuizQuestion[];
  userAnswers: Record<string, string>;
  isComplete: boolean;
} {
  return {
    id: dbQuiz.uuid,
    questions: dbQuiz.questions.map((qq) => ({
      id: qq.question.uuid,
      question: qq.question.question,
      options: qq.question.options.map((opt) => opt.text),
      correctAnswer:
        qq.question.options.find((opt) => opt.isCorrect)?.text || "",
      explanation: qq.question.explanation,
      topic: qq.question.topic as any,
      difficulty: qq.question.difficulty as any,
    })),
    userAnswers: dbQuiz.questions.reduce((answers, qq) => {
      if (qq.userAnswer) {
        const option = qq.question.options.find(
          (opt) => opt.id === qq.userAnswer
        );
        if (option) {
          answers[qq.question.uuid] = option.text;
        }
      }
      return answers;
    }, {} as Record<string, string>),
    isComplete: dbQuiz.isCompleted,
  };
}

/**
 * Convert a database QuizCompletionResult to frontend QuizResults
 */
export function toQuizResults(dbResults: QuizCompletionResult): QuizResults {
  const topicBreakdown: TopicPerformance[] = dbResults.topicPerformance.map(
    (tp) => ({
      topic: tp.topic as any,
      correct: tp.correct,
      total: tp.total,
      percentage: tp.percentage,
    })
  );

  // Determine improvement areas (topics with < 70% score)
  const improvementAreas = topicBreakdown
    .filter((topic) => topic.percentage < 70)
    .map((topic) => topic.topic);

  // Determine strengths (topics with >= 90% score)
  const strengths = topicBreakdown
    .filter((topic) => topic.percentage >= 90)
    .map((topic) => topic.topic);

  return {
    score: {
      correct: dbResults.correctAnswers,
      total: dbResults.totalQuestions,
      percentage: dbResults.score,
    },
    passed: dbResults.passed,
    topicBreakdown,
    improvementAreas,
    strengths,
  };
}

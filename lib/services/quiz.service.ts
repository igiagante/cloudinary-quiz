import { debug } from "@/lib/debug";
import { quizRepository } from "@/lib/db/repositories/quiz.repository";
import { questionRepository } from "@/lib/db/repositories/question.repository";
import { TopicPerformance } from "./quiz-answer.service";
import { db } from "@/lib/db";

/**
 * Interface for quiz creation inputs
 */
export interface CreateQuizInput {
  userId: string;
  numQuestions: number;
  topics?: string[];
  difficulty?: string;
  questionIds?: string[];
}

/**
 * Service for quiz-related operations
 */
export class QuizService {
  /**
   * Get a quiz by ID
   */
  async getQuizById(quizId: string) {
    try {
      return await quizRepository.getById(quizId);
    } catch (error) {
      debug.error(`Error fetching quiz ${quizId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate score as a percentage
   */
  calculateScore(correctCount: number, totalQuestions: number): number {
    return Math.round((correctCount / totalQuestions) * 100);
  }

  /**
   * Mark a quiz as complete and save results
   */
  async completeQuiz(
    quizId: string,
    correctCount: number,
    totalQuestions: number,
    topicPerformance: TopicPerformance[]
  ): Promise<void> {
    try {
      const score = this.calculateScore(correctCount, totalQuestions);
      await quizRepository.completeQuiz(quizId, score, topicPerformance);
      debug.log(`Quiz ${quizId} completed with score ${score}%`);
    } catch (error) {
      debug.error(`Error completing quiz ${quizId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new quiz
   */
  async createQuiz(input: CreateQuizInput): Promise<{ quizId: string }> {
    try {
      const { userId, numQuestions, questionIds, topics, difficulty } = input;

      // Handle case where specific question IDs are provided
      if (questionIds && questionIds.length > 0) {
        const validQuestionIds = await this.resolveQuestionIds(
          questionIds,
          numQuestions
        );

        if (validQuestionIds.length === 0) {
          throw new Error("No valid questions found with the provided IDs");
        }

        const quiz = await quizRepository.create({
          userId,
          numQuestions: validQuestionIds.length,
          questionIds: validQuestionIds,
        });

        return { quizId: quiz.id };
      }

      // Get questions by topic and difficulty
      const selectedQuestions = await this.getQuestionsByTopicAndDifficulty(
        topics,
        difficulty,
        numQuestions
      );

      if (selectedQuestions.length < numQuestions) {
        throw new Error(
          `Not enough questions available. Requested ${numQuestions}, found ${selectedQuestions.length}`
        );
      }

      // Create the quiz with the selected questions
      const selectedQuestionIds = selectedQuestions.map((q) => q.id.toString());
      const quiz = await quizRepository.create({
        userId,
        numQuestions,
        questionIds: selectedQuestionIds,
      });

      return { quizId: quiz.id };
    } catch (error) {
      debug.error("Error creating quiz:", error);
      throw error;
    }
  }

  /**
   * Resolve question IDs, ensuring they are valid
   * @private
   */
  private async resolveQuestionIds(
    questionIds: string[],
    fallbackCount: number
  ): Promise<string[]> {
    try {
      // Find valid questions by ID or UUID
      let validQuestions = await Promise.all(
        questionIds.map(async (id) => {
          return await questionRepository.findByIdOrUuid(id);
        })
      );

      // Filter out any null results and get the actual question IDs
      validQuestions = validQuestions.filter(
        (q) => q !== null && q !== undefined
      );

      let validQuestionIds = validQuestions
        .map((q) => q?.id)
        .filter((id): id is any => id !== undefined && id !== null)
        .map((id) => id.toString());

      // If no valid questions found, get random questions from the database
      if (validQuestionIds.length === 0) {
        const availableQuestions = await db.query.questions.findMany({
          limit: 20,
        });

        if (availableQuestions.length === 0) {
          throw new Error("No questions available in the database");
        }

        // Take random questions up to the requested number
        const selectedQuestions = availableQuestions
          .sort(() => 0.5 - Math.random())
          .slice(0, fallbackCount || 10);

        validQuestionIds = selectedQuestions.map((q) => q.id.toString());
      }

      return validQuestionIds;
    } catch (error) {
      debug.error("Error resolving question IDs:", error);
      throw error;
    }
  }

  /**
   * Get questions by topic and difficulty
   * @private
   */
  private async getQuestionsByTopicAndDifficulty(
    topics?: string[],
    difficulty?: string,
    limit?: number
  ): Promise<any[]> {
    try {
      if (topics && topics.length > 0) {
        return await questionRepository.getByTopicAndDifficulty(
          topics,
          difficulty,
          limit
        );
      } else {
        // If no topics provided, use all topics
        const allTopics = await questionRepository.getAllTopics();
        return await questionRepository.getByTopicAndDifficulty(
          allTopics,
          difficulty,
          limit
        );
      }
    } catch (error) {
      debug.error("Error getting questions by topic and difficulty:", error);
      throw error;
    }
  }

  /**
   * Get quiz history for a user
   */
  async getQuizHistoryByUser(userId: string): Promise<any[]> {
    try {
      return await quizRepository.getQuizHistory(userId);
    } catch (error) {
      debug.error(`Error fetching quiz history for user ${userId}:`, error);
      throw error;
    }
  }
}

import { debug } from "@/lib/debug";
import { db } from "@/lib/db";
import { QuizQuestion, QuizResults } from "@/types";
import { userRepository } from "@/lib/db/repositories/user.repository";
import { v4 as uuidv4 } from "uuid";
import { eq, and, inArray } from "drizzle-orm";
import {
  quizzes,
  quizQuestions,
  topicPerformance,
  users,
  questions,
  options,
} from "@/lib/db/schema";
import { parseTopics } from "@/lib/db/parser/topic-parser";
import { TopicScore } from "@/lib/types";
import { analyzeQuizResults } from "@/lib/quiz-generator";

// Define interfaces for database entity types
interface DbQuestion {
  id: string;
  uuid?: string;
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

// Define interfaces for custom topic score structure
interface CustomTopicScore {
  topicId: number;
  score: number;
  possible: number;
  weight: number;
}

/**
 * Service for generating quiz reports and analyses
 */
export class QuizReportService {
  /**
   * Generate a detailed report for a completed quiz
   */
  async generateQuizReport(
    quizQuestionsList: QuizQuestion[],
    userAnswers: Record<string, string | string[]>,
    userId?: string // Optional user ID for tracking
  ): Promise<QuizResults & { quizId: string }> {
    debug.log("Generate Quiz Report started");
    debug.log(`Question count: ${quizQuestionsList.length}`);
    debug.log(`User answers: ${Object.keys(userAnswers).length}`);
    debug.log(`User ID: ${userId || "anonymous"}`);

    // Analyze the quiz results
    const analysis = analyzeQuizResults(quizQuestionsList, userAnswers);

    try {
      return await db.transaction(async (tx: typeof db) => {
        debug.log("Starting database transaction for quiz report");

        // Run initial queries in parallel
        const [userResult, dbQuestions] = await Promise.all([
          // User lookup - casting to any as a workaround for DB schema changes
          userId
            ? (tx
                .select({ id: users.id })
                .from(users)
                .where(eq(users.id, userId))
                .limit(1) as Promise<any[]>)
            : Promise.resolve([]),

          // Questions lookup - using id instead of uuid
          tx
            .select({ id: questions.id })
            .from(questions)
            .where(
              inArray(
                questions.id,
                quizQuestionsList.map((q) => q.id)
              )
            ),
        ]);

        debug.log(`Found user record: ${userResult.length > 0}`);
        debug.log(`Found ${dbQuestions.length} question records in database`);

        // Process user and get options in parallel
        const [quiz, allOptions] = await Promise.all([
          // Create new quiz record
          (
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
              .returning() as unknown as Promise<DbQuiz[]>
          ).then((quizzes) => {
            const quiz = quizzes[0];
            debug.log(
              `Created new quiz with ID: ${quiz.id}, UUID: ${quiz.uuid}`
            );
            // Store quiz ID in localStorage for future reference
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem("quizId", quiz.uuid);
                debug.log(`Saved quiz UUID ${quiz.uuid} to localStorage`);
              } catch (e) {
                debug.error("Failed to save quiz ID to localStorage:", e);
              }
            }
            return quiz;
          }),

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

        debug.log(`Found ${allOptions.length} options in database`);

        // Prepare all question mappings in advance
        const mappedQuestions = await this.mapFrontendQuizToDb(
          quizQuestionsList,
          userAnswers,
          quiz.uuid
        );

        debug.log(
          `Mapped ${mappedQuestions.length} questions for database saving`
        );

        if (mappedQuestions.length > 0) {
          // Create a lookup map for faster access
          const questionLookup = new Map(
            dbQuestions.map((q: DbQuestion) => [q.id.toString(), q.id])
          );

          // Create option lookup map for faster access
          const optionLookup = new Map();
          allOptions.forEach((opt: DbOption) => {
            const key = `${opt.questionId}:${opt.text}`;
            optionLookup.set(key, opt.id);
          });

          // Prepare all quiz questions for batch insert
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

          debug.log(
            `Prepared ${quizQuestionsToInsert.length} quiz questions for insertion`
          );

          // Batch insert all quiz questions at once
          if (quizQuestionsToInsert.length > 0) {
            await tx.insert(quizQuestions).values(quizQuestionsToInsert);
            debug.log(
              `Inserted ${quizQuestionsToInsert.length} quiz questions into database`
            );
          }
        }

        // Save topic performance (batch insert)
        if (analysis.topicPerformance) {
          const topicPerformanceToInsert = Object.entries(
            analysis.topicPerformance
          )
            .filter(([_, data]) => data && data.total > 0)
            .map(([topic, data]) => ({
              quizId: quiz.id,
              topic: this.mapToValidTopic(topic) as any,
              correct: data.correct,
              total: data.total,
              percentage: Math.round(data.percentage),
              createdAt: new Date(),
            }));

          if (topicPerformanceToInsert.length > 0) {
            try {
              await tx
                .insert(topicPerformance)
                .values(topicPerformanceToInsert);
              debug.log(
                `Inserted ${topicPerformanceToInsert.length} topic performance records`
              );
            } catch (error) {
              debug.error(
                "Error inserting topic performance - continuing anyway:",
                error
              );
              // Continue execution even if topic performance fails
            }
          }
        }

        // Update user topic performance statistics (if user exists)
        if (userResult[0]?.id) {
          // Fire and forget - don't await the update
          void userRepository
            .updateTopicPerformance(
              userResult[0].id.toString(),
              quiz.id.toString(),
              tx
            )
            .catch((error) => {
              debug.error("Error updating user topic performance:", error);
            });
        }

        debug.log("Quiz report generation completed successfully");

        // Return the results with the quiz ID
        return {
          ...analysis,
          quizId: quiz.uuid,
          topicBreakdown: analysis.topicPerformance
            ? Object.entries(analysis.topicPerformance).map(
                ([topic, data]) => ({
                  topic: topic as any,
                  ...data,
                })
              )
            : [],
        };
      });
    } catch (error) {
      debug.error("Error in quiz report generation:", error);
      throw error;
    }
  }

  /**
   * Map frontend quiz data to database format
   */
  private async mapFrontendQuizToDb(
    quizQuestionsList: QuizQuestion[],
    userAnswers: Record<string, string | string[]>,
    quizId: string
  ) {
    debug.log("Mapping frontend quiz data to database format");

    // Create a map of questions for faster lookup
    const questionsMap = new Map(quizQuestionsList.map((q) => [q.id, q]));

    // Process each user answer
    return Object.entries(userAnswers)
      .map(([questionId, answer]) => {
        const question = questionsMap.get(questionId);
        if (!question) return null;

        // Handle array of answers (multiple-choice)
        const userAnswer = Array.isArray(answer) ? answer[0] : answer;
        const isCorrect =
          question.hasMultipleCorrectAnswers && question.correctAnswers
            ? JSON.stringify(question.correctAnswers.sort()) ===
              JSON.stringify((Array.isArray(answer) ? answer : [answer]).sort())
            : userAnswer === question.correctAnswer;

        return {
          id: questionId,
          userAnswer,
          isCorrect,
        };
      })
      .filter((q): q is NonNullable<typeof q> => q !== null);
  }

  /**
   * Calculate topic scores from answers and questions
   */
  calculateTopicScores(
    answers: Answer[],
    questions: Question[]
  ): CustomTopicScore[] {
    debug.log(`Calculating topic scores for ${answers.length} answers`);

    // Group questions by topic
    const questionsByTopic = new Map<number, Question[]>();
    questions.forEach((question) => {
      if (question.topicId !== undefined) {
        const topicQuestions = questionsByTopic.get(question.topicId) || [];
        topicQuestions.push(question);
        questionsByTopic.set(question.topicId, topicQuestions);
      }
    });

    // Map questions to answers
    const answersById = new Map<string, Answer>();
    answers.forEach((answer) => {
      answersById.set(answer.questionId, answer);
    });

    // Calculate scores by topic
    const topicScores: CustomTopicScore[] = [];
    questionsByTopic.forEach((topicQuestions, topicId) => {
      let totalPoints = 0;
      let correctPoints = 0;

      topicQuestions.forEach((question) => {
        const answer = answersById.get(question.id);
        const pointValue = question.pointValue || 1;

        totalPoints += pointValue;
        if (answer && answer.isCorrect) {
          correctPoints += pointValue;
        }
      });

      topicScores.push({
        topicId,
        score: correctPoints,
        possible: totalPoints,
        weight: totalPoints / questions.length,
      });
    });

    return topicScores;
  }

  /**
   * Generate a breakdown report for each topic
   */
  generateTopicBreakdownReport(topicScores: CustomTopicScore[]): string {
    debug.log("Generating topic breakdown report");

    let report = "## Topic Breakdown\n\n";

    topicScores.forEach((topic) => {
      const percentage = ((topic.score / topic.possible) * 100).toFixed(2);
      report += `- Topic ${topic.topicId}: ${topic.score}/${topic.possible} (${percentage}%)\n`;
    });

    return report;
  }

  /**
   * Generate a formatted report for quiz results
   */
  generateReport(results: QuizResults): string {
    const scorePercentage = results.score.percentage.toFixed(2);
    const passOrFail = results.passed ? "PASSED" : "FAILED";

    return (
      `# Quiz Results: ${passOrFail} (${scorePercentage}%)\n\n` +
      `Correct answers: ${results.score.correct} / ${results.score.total}\n\n` +
      `Areas for improvement: ${results.improvementAreas.join(", ")}\n\n`
    );
  }

  /**
   * Map a topic string to a valid topic value
   */
  private mapToValidTopic(topic: string): string {
    try {
      // Try to map to a valid topic
      const parsedTopics = parseTopics([topic]);
      if (parsedTopics.length > 0) {
        return parsedTopics[0];
      }
    } catch (error) {
      debug.warn(`Could not parse topic "${topic}"`, error);
    }

    // Return original if parsing fails
    return topic;
  }
}

import { debug } from "@/lib/debug";
import { quizRepository } from "@/lib/db/repositories/quiz.repository";
import { TopicMapperService } from "./topic-mapper.service";

/**
 * Interface for quiz with essential properties
 */
interface Quiz {
  id: string;
  questions: Array<{
    questionId: string;
    question: {
      id: string | number;
      topic: string;
      options: Array<{
        id: number;
        text: string;
        isCorrect: boolean;
      }>;
      hasMultipleCorrectAnswers?: boolean;
    };
  }>;
}

/**
 * Interface for answer data
 */
interface Answer {
  questionId: string;
  answer: string[];
}

/**
 * Interface for processed question
 */
interface ProcessedQuestion {
  questionId: string;
  processed: boolean;
  isCorrect: boolean;
  question: any;
}

/**
 * Interface for topic performance data
 */
export interface TopicPerformance {
  topic: string;
  correct: number;
  total: number;
  percentage: number;
}

/**
 * Interface for answer processing result
 */
export interface AnswerProcessingResult {
  correctCount: number;
  processedAnswers: Array<{
    questionId: string;
    isCorrect: boolean;
  }>;
  questionMap: Map<string, ProcessedQuestion>;
}

/**
 * Service for processing quiz answers
 */
export class QuizAnswerService {
  private topicMapper: TopicMapperService;

  constructor() {
    this.topicMapper = new TopicMapperService();
  }

  /**
   * Deduplicates answers when multiple submissions exist for the same question
   */
  deduplicateAnswers(answers: Answer[]): Answer[] {
    // Create a map to hold the latest answer for each question
    const uniqueAnswerMap = new Map<string, Answer>();

    answers.forEach((a) => {
      // If we already have this question ID, keep the one with more answers
      if (uniqueAnswerMap.has(a.questionId)) {
        const existing = uniqueAnswerMap.get(a.questionId)!;
        // If the new answer has more options, replace the existing one
        if (a.answer.length > existing.answer.length) {
          debug.log(
            `Replacing duplicate answer for question ${a.questionId} with more complete version`
          );
          uniqueAnswerMap.set(a.questionId, a);
        }
      } else {
        uniqueAnswerMap.set(a.questionId, a);
      }
    });

    // Convert map back to array
    return Array.from(uniqueAnswerMap.values());
  }

  /**
   * Remove duplicates within a single answer's options
   */
  removeDuplicateOptions(answers: Answer[]): Answer[] {
    return answers.map((a) => {
      // Remove duplicate option IDs from the same answer
      const uniqueOptions = Array.from(new Set(a.answer));

      // Log if we found duplicates
      if (uniqueOptions.length !== a.answer.length) {
        debug.log(
          `Found duplicate options in answer for question ${a.questionId}: ${a.answer} -> ${uniqueOptions}`
        );
      }

      return {
        ...a,
        answer: uniqueOptions,
      };
    });
  }

  /**
   * Checks if an answer is correct for a question
   */
  checkAnswerCorrectness(question: any, answer: string[]): boolean {
    // Get all options for this question with their IDs and correctness
    const optionsWithDetails = question.options.map(
      (opt: any, index: number) => ({
        id: opt.id,
        index: index + 1, // 1-based index
        text: opt.text,
        isCorrect: opt.isCorrect,
      })
    );

    // For questions with multiple correct answers
    if (question.hasMultipleCorrectAnswers) {
      const correctOptionIds = question.options
        .filter((o: any) => o.isCorrect)
        .map((o: any) => {
          // Try both ID and index-based matching
          return [
            o.id.toString(),
            (
              optionsWithDetails.find((opt: any) => opt.id === o.id)?.index || 0
            ).toString(),
          ];
        })
        .flat();

      // Check if all required correct answers are provided (and no extra ones)
      const allCorrectAnswersSelected = correctOptionIds.every((id: string) => {
        return answer.some((ans) => ans === id || ans.toString() === id);
      });

      const correctOptionCount = correctOptionIds.length;
      const selectedCorrectCount = answer.filter(
        (ans) =>
          correctOptionIds.includes(ans) ||
          correctOptionIds.includes(ans.toString())
      ).length;

      return (
        allCorrectAnswersSelected && selectedCorrectCount === correctOptionCount
      );
    }
    // For single answer questions
    else {
      const correctOption = question.options.find((o: any) => o.isCorrect);

      if (correctOption) {
        const correctOptionId = correctOption.id.toString();
        const correctOptionIndex = (
          optionsWithDetails.find((o: any) => o.id === correctOption.id)
            ?.index || 0
        ).toString();

        // Check if the user's answer matches either the ID or the index of the correct option
        return (
          answer.length === 1 &&
          (answer[0] === correctOptionId || answer[0] === correctOptionIndex)
        );
      } else {
        debug.warn(`No correct option found for question ${question.id}!`);
        return false;
      }
    }
  }

  /**
   * Save an answer to the database
   */
  async saveAnswer(
    quizId: string,
    questionId: string,
    answer: string[],
    isCorrect: boolean
  ): Promise<boolean> {
    try {
      if (!answer || answer.length === 0) {
        debug.warn(`No answer values provided for question ${questionId}`);
        return false;
      }

      // Try different ways of parsing the answer
      let savedSuccessfully = false;

      // First attempt - try to parse as number (this is the option index)
      if (answer[0] && !isNaN(parseInt(answer[0], 10))) {
        const optionId = parseInt(answer[0], 10);

        try {
          // Verify that the option ID exists in the database
          const optionExists = await this.verifyOptionExists(optionId);

          if (optionExists) {
            await quizRepository.updateQuizAnswer(
              quizId,
              questionId,
              optionId,
              isCorrect
            );
            return true;
          } else {
            debug.warn(
              `Option ID ${optionId} does not exist in the database. Falling back to null.`
            );
          }
        } catch (error) {
          debug.error(`Error verifying option ID ${optionId}:`, error);
        }
      }

      // Final attempt - use null but still mark correct/incorrect
      await quizRepository.updateQuizAnswer(
        quizId,
        questionId,
        null,
        isCorrect
      );
      return true;
    } catch (error) {
      debug.error(`Error saving answer for question ${questionId}:`, error);
      return false;
    }
  }

  /**
   * Verify that an option ID exists in the database
   */
  async verifyOptionExists(optionId: number): Promise<boolean> {
    try {
      // Use the repository to check if the option exists
      const option = await quizRepository.getOptionById(optionId);
      return !!option;
    } catch (error) {
      debug.error(`Error verifying option existence:`, error);
      return false;
    }
  }

  /**
   * Process all answers for a quiz
   */
  async processAnswers(
    quiz: Quiz,
    answers: Answer[]
  ): Promise<AnswerProcessingResult> {
    let correctCount = 0;
    const processedAnswers: Array<{ questionId: string; isCorrect: boolean }> =
      [];

    // Step 1: Deduplicate answers
    const dedupedAnswers = this.deduplicateAnswers(answers);
    debug.log(`Deduped answers: ${answers.length} -> ${dedupedAnswers.length}`);

    // Step 2: Remove duplicate options within each answer
    const finalAnswers = this.removeDuplicateOptions(dedupedAnswers);

    // Create a map of all questions for easier access
    const questionMap = new Map<string, ProcessedQuestion>();
    quiz.questions.forEach((qItem) => {
      questionMap.set(qItem.questionId, {
        questionId: qItem.questionId,
        question: qItem.question,
        processed: false,
        isCorrect: false,
      });
    });

    // Step 3: Process each answer
    for (const answerItem of finalAnswers) {
      const { questionId, answer } = answerItem;
      const questionData = questionMap.get(questionId);

      if (!questionData) {
        debug.warn(`Question ${questionId} not found in quiz`);
        continue;
      }

      // Check if the answer is correct
      const isCorrect = this.checkAnswerCorrectness(
        questionData.question,
        answer
      );

      // Save the answer to the database
      await this.saveAnswer(quiz.id, questionId, answer, isCorrect);

      // Update our tracking data
      if (isCorrect) {
        correctCount++;
      }

      // Mark this question as processed
      questionData.processed = true;
      questionData.isCorrect = isCorrect;
      questionMap.set(questionId, questionData);

      processedAnswers.push({
        questionId,
        isCorrect,
      });
    }

    return {
      correctCount,
      processedAnswers,
      questionMap,
    };
  }

  /**
   * Calculate topic performance statistics based on quiz answers
   */
  calculateTopicPerformance(
    quiz: Quiz,
    questionMap: Map<string, ProcessedQuestion>
  ): TopicPerformance[] {
    // Calculate topic performance
    const topicPerformance: Record<string, { correct: number; total: number }> =
      {};

    // Process each question to build topic statistics
    for (const qItem of quiz.questions) {
      const topic = qItem.question.topic;

      // Skip questions with invalid topics
      if (!topic || typeof topic !== "string") {
        debug.error(
          "Invalid topic for question:",
          qItem.question.id,
          qItem.question.topic
        );
        continue;
      }

      // Initialize topic if needed
      if (!topicPerformance[topic]) {
        topicPerformance[topic] = { correct: 0, total: 0 };
      }

      // Count every question in the total
      topicPerformance[topic].total++;

      // Check if this question was answered correctly
      const questionData = questionMap.get(qItem.questionId);
      if (questionData?.processed && questionData.isCorrect) {
        topicPerformance[topic].correct++;
      }
    }

    // Format topic performance for the repository
    const topicPerformanceData = Object.entries(topicPerformance).map(
      ([topic, data]) => ({
        topic: this.topicMapper.mapToValidTopicEnum(topic),
        correct: data.correct,
        total: data.total,
        percentage:
          data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      })
    );

    // Check for duplicate topics after mapping
    const mappedTopics = topicPerformanceData.map((tp) => tp.topic);
    const { hasDuplicates, duplicates } =
      this.topicMapper.detectDuplicateTopics(mappedTopics);

    if (hasDuplicates) {
      debug.warn("WARNING: Duplicate topics found after mapping!");
      debug.warn("Duplicate topics:", duplicates);
    }

    return topicPerformanceData;
  }
}

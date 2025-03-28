import { nanoid } from "nanoid";
import { debug } from "@/lib/debug";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { questions } from "@/lib/db/schema";
import { questionRepository } from "@/lib/db/repositories/question.repository";
import { generateQuizFast, setVerboseLogging } from "@/lib/quiz-generator";
import { z } from "zod";

// Define a type for option objects
interface OptionWithCorrectness {
  text: string;
  isCorrect: boolean;
}

// Define a type for the question with options
interface FormattableQuestion {
  id: string | number; // Support both types
  question: string;
  explanation: string;
  topic: string;
  difficulty: string;
  source?: string;
  status?: string;
  qualityScore?: number;
  hasMultipleCorrectAnswers?: boolean;
  options: Array<{ text: string; isCorrect: boolean }>;
}

// Input parameters for generating questions
export interface GenerateQuestionsInput {
  numQuestions: number;
  topics: string[];
  difficulty?: "easy" | "medium" | "hard";
  model?: "openai" | "claude" | "none";
  maxNewQuestions?: number;
  verboseLogging?: boolean;
}

// Output format for generated questions
export interface GeneratedQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  correctAnswers: string[];
  hasMultipleCorrectAnswers: boolean;
  explanation: string;
  topic: string;
  difficulty: string;
  source: string;
  status: string;
  qualityScore: number;
}

// Question schema definition moved from the route file
const questionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctAnswerIndex: z.number().min(0).max(3),
  explanation: z.string(),
  topic: z.string().optional(),
  subtopic: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  tags: z.array(z.string()).optional(),
});

// Input validation schema
const GenerateSchema = z.object({
  numQuestions: z.number().min(1).max(30).default(10),
  topics: z.array(z.string()).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  model: z.enum(["openai", "claude", "none"]).default("none"),
  maxNewQuestions: z.number().min(1).max(10).default(3),
  verboseLogging: z.boolean().optional(),
});

/**
 * Service for generating and retrieving quiz questions
 */
export class GenerateQuestionsService {
  /**
   * Utility function to shuffle an array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  /**
   * Format a question with shuffled options
   */
  private formatQuestionWithShuffledOptions(
    q: FormattableQuestion
  ): GeneratedQuestion | null {
    if (!q) return null;

    const optionsWithCorrectness: OptionWithCorrectness[] = q.options.map(
      (o) => ({
        text: o.text,
        isCorrect: o.isCorrect,
      })
    );

    // Shuffle the options
    const shuffledOptions = this.shuffleArray(optionsWithCorrectness);

    // Check if this question should have multiple correct answers
    const questionText = q.question.toLowerCase();
    const textIndicatesMultipleSelection =
      questionText.includes("select up to") ||
      questionText.includes("select all that apply") ||
      questionText.includes("select two") ||
      questionText.includes("select 2") ||
      (questionText.includes("(select") && questionText.includes(")"));

    // Get count from "select up to X" if it exists
    const match = questionText.match(/select up to (\d+)/i);
    const selectUpToCount = match && match[1] ? parseInt(match[1], 10) : 0;

    // Count correct options
    const correctOptions = shuffledOptions.filter((o) => o.isCorrect);

    // IMPORTANT: Use database flag if available, otherwise determine from question text/options
    const hasMultipleCorrectAnswers =
      q.hasMultipleCorrectAnswers === true ||
      correctOptions.length > 1 ||
      (textIndicatesMultipleSelection && selectUpToCount > 1);

    // Get all correct answers for multiple choice questions
    const correctAnswers = hasMultipleCorrectAnswers
      ? shuffledOptions.filter((o) => o.isCorrect).map((o) => o.text)
      : [];

    return {
      id: q.id?.toString() || nanoid(),
      question: q.question,
      options: shuffledOptions.map((o) => o.text),
      correctAnswer: shuffledOptions.find((o) => o.isCorrect)?.text || "",
      correctAnswers: hasMultipleCorrectAnswers ? correctAnswers : [],
      hasMultipleCorrectAnswers: hasMultipleCorrectAnswers,
      explanation: q.explanation,
      topic: q.topic,
      difficulty: q.difficulty,
      source: q.source || "openai",
      status: q.status || "active",
      qualityScore: q.qualityScore || 0,
    };
  }

  /**
   * Generate questions based on the provided parameters
   */
  async generateQuestions(
    input: GenerateQuestionsInput
  ): Promise<GeneratedQuestion[]> {
    debug.log(
      `Generating ${
        input.numQuestions
      } questions for topics: ${input.topics.join(", ")}`
    );

    const {
      numQuestions,
      topics,
      difficulty,
      model = "none",
      maxNewQuestions = 3,
      verboseLogging = false,
    } = input;

    // Set verbose logging if requested
    if (verboseLogging) {
      setVerboseLogging(true);
    }

    // Initialize array to hold our questions
    let generatedQuestions: GeneratedQuestion[] = [];

    // Only fetch from database when model is "none" (database only)
    if (model === "none") {
      // Fetch actual questions from the database based on topics
      let dbQuestions: (typeof questions.$inferSelect)[] = [];

      debug.log("Fetching questions from database for topics:", topics);

      for (const topic of topics) {
        const topicQuestions = await db.query.questions.findMany({
          where: eq(questions.topic, topic),
          limit: Math.ceil(numQuestions / topics.length) + 5, // Get a few extra for diversity
        });

        dbQuestions = [...dbQuestions, ...topicQuestions];
      }

      debug.log(`Found ${dbQuestions.length} questions in database`);

      // Shuffle and limit to requested number
      if (dbQuestions.length > numQuestions) {
        dbQuestions = dbQuestions
          .sort(() => 0.5 - Math.random())
          .slice(0, numQuestions);
      }

      // Format questions for the response
      generatedQuestions = dbQuestions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options as string[],
        correctAnswer: q.correctAnswer as string,
        correctAnswers: [],
        hasMultipleCorrectAnswers: false,
        explanation: q.explanation || "",
        topic: q.topic,
        difficulty: q.difficulty || "medium",
        source: q.source || "database",
        status: q.status || "active",
        qualityScore: q.qualityScore || 0,
      }));
    } else {
      // Use the quiz generator for AI model generation
      debug.log(`Using ${model} model to generate questions`);
      try {
        const questions = await generateQuizFast(
          numQuestions,
          topics as any[], // Cast to any[] to match the expected type
          difficulty,
          true, // Force generate
          model as any, // Cast to match the expected ModelType
          maxNewQuestions
        );

        generatedQuestions = questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          correctAnswers: q.correctAnswers || [],
          hasMultipleCorrectAnswers: q.hasMultipleCorrectAnswers || false,
          explanation: q.explanation || "",
          topic: q.topic,
          difficulty: q.difficulty || "medium",
          source: q.source || model,
          status: "active",
          qualityScore: 0,
        }));
      } catch (error) {
        debug.error("Error generating questions with AI model:", error);
        throw new Error(`Failed to generate questions with ${model} model`);
      }
    }

    if (generatedQuestions.length === 0) {
      debug.error("No questions could be generated");
      throw new Error("Could not generate questions");
    }

    debug.log(`Successfully generated ${generatedQuestions.length} questions`);
    return generatedQuestions;
  }

  /**
   * Get questions by topic, difficulty, and other filters
   */
  async getQuestions(params: {
    topic?: string;
    difficulty?: string;
    limit?: number;
    status?: string;
    includeDeleted?: boolean;
  }): Promise<GeneratedQuestion[]> {
    const {
      topic,
      difficulty,
      limit = 10,
      status = "active",
      includeDeleted = false,
    } = params;

    debug.log(
      `Fetching questions with filters: topic=${topic}, difficulty=${difficulty}, limit=${limit}, status=${status}`
    );

    let questions;

    if (topic) {
      questions = await questionRepository.getByTopicAndDifficulty(
        [topic],
        difficulty || undefined,
        limit,
        status as string
      );
    } else if (includeDeleted) {
      // Get all questions including deleted ones
      questions = await questionRepository.getAll(true);
      questions = questions.slice(0, limit);
    } else {
      // Get only active questions by default
      questions = await questionRepository.getByStatus(status as any, limit);
    }

    debug.log(`Found ${questions.length} questions matching the criteria`);

    const formattedQuestions = questions
      .map((q) =>
        this.formatQuestionWithShuffledOptions(q as FormattableQuestion)
      )
      .filter((q): q is GeneratedQuestion => q !== null);

    return formattedQuestions;
  }

  // Add the schemas as static properties or methods for access
  static get questionSchema() {
    return questionSchema;
  }

  static get generateSchema() {
    return GenerateSchema;
  }

  // Validate input using the schema
  validateInput(input: unknown) {
    return GenerateSchema.parse(input);
  }
}

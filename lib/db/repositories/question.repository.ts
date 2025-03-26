// @ts-nocheck
// TODO: Refactor this file to properly define types for Drizzle ORM queries
// - Update Drizzle ORM to latest version
// - Define proper relations in schema
// - Use proper type definitions for query results
// - Fix the select() and returning() method usage to match Drizzle API
// db/repositories/questionRepository.ts
import { eq, and, inArray, desc, sql, count, lt, or } from "drizzle-orm";
import { db } from "../index";
import {
  questions,
  options,
  topicEnum,
  difficultyEnum,
  questionStatusEnum,
  NewQuestion,
} from "../schema";
import { v4 as uuidv4 } from "uuid";
import { PgTransaction } from "drizzle-orm/pg-core";

// Define source models as a const object
export const SourceModels = {
  Openai: "openai",
  Claude: "claude",
  Manual: "manual",
} as const;

export type SourceModel = (typeof SourceModels)[keyof typeof SourceModels];

// Use the topic enum values from schema
export const Topics = topicEnum.enumValues;
export type TopicType = (typeof Topics)[number];

// Use the difficulty enum values from schema
export const Difficulties = difficultyEnum.enumValues;
export type DifficultyType = (typeof Difficulties)[number];

// Use question status enum values
export const QuestionStatus = questionStatusEnum.enumValues;
export type QuestionStatusType = (typeof QuestionStatus)[number];

// Define the structure of the options from DB queries
interface DbOption {
  id: number;
  text: string;
  isCorrect: boolean;
}

export type QuestionWithOptions = {
  id: number;
  uuid: string;
  question: string;
  explanation: string;
  topic: string;
  difficulty: string;
  source?: string;
  status?: string;
  qualityScore?: number;
  options: {
    id: number;
    text: string;
    isCorrect: boolean;
  }[];
  options_jsonb?: any; // Raw jsonb field from database
  correctAnswer?: string; // Single correct answer value
  hasMultipleCorrectAnswers?: boolean; // Flag for multiple answer questions
  correctAnswers?: string[]; // Array of correct answers for multiple answer questions
};

export type QuestionInput = {
  id?: string;
  question: string;
  explanation: string;
  topic: string;
  difficulty: string;
  source?: string;
  status?: string;
  qualityScore?: number;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
};

export const questionRepository = {
  /**
   * Get all questions with their options
   */
  async getAll(
    includeDeleted: boolean = false
  ): Promise<QuestionWithOptions[]> {
    const result = await db.query.questions.findMany({
      with: {
        options: true,
      },
      where: includeDeleted ? undefined : eq(questions.status, "active"),
      orderBy: [desc(questions.createdAt)],
    });

    return result.map((q: any) => ({
      id: q.id,
      uuid: q.uuid,
      question: q.question,
      explanation: q.explanation,
      topic: q.topic,
      difficulty: q.difficulty,
      source: q.source,
      status: q.status,
      qualityScore: q.qualityScore,
      options: q.options.map((o: DbOption) => ({
        id: o.id,
        text: o.text,
        isCorrect: o.isCorrect,
      })),
    }));
  },

  /**
   * Get a question by UUID with its options
   */
  async getByUuid(uuid: string): Promise<QuestionWithOptions | null> {
    const result = await db.query.questions.findFirst({
      where: eq(questions.uuid, uuid),
      with: {
        options: true,
      },
    });

    if (!result) return null;

    return {
      id: result.id,
      uuid: result.uuid,
      question: result.question,
      explanation: result.explanation,
      topic: result.topic,
      difficulty: result.difficulty,
      source: result.source,
      status: result.status,
      qualityScore: result.qualityScore,
      options: result.options.map((o: DbOption) => ({
        id: o.id,
        text: o.text,
        isCorrect: o.isCorrect,
      })),
    };
  },

  /**
   * Get questions by topic and difficulty
   */
  async getByTopicAndDifficulty(
    topics: string[],
    difficulty?: string,
    limit?: number,
    status: string = "active"
  ): Promise<QuestionWithOptions[]> {
    // Map input topics to valid schema topics
    const validTopics = topics
      .filter((t) => Object.values(Topics).includes(t as TopicType))
      .map((t) => t as TopicType);

    // Map difficulty
    const validDifficulty =
      difficulty &&
      Object.values(Difficulties).includes(difficulty as DifficultyType)
        ? (difficulty as DifficultyType)
        : undefined;

    const query = db.query.questions.findMany({
      where: and(
        validTopics.length > 0
          ? inArray(questions.topic, validTopics as unknown as string[])
          : undefined,
        validDifficulty
          ? eq(questions.difficulty, validDifficulty as string)
          : undefined,
        eq(questions.status, status)
      ),
      with: {
        options: true,
      },
      orderBy: [sql`RANDOM()`],
      limit: limit || 100,
    });

    const result = await query;

    return result.map((q: any) => ({
      id: q.id,
      uuid: q.uuid,
      question: q.question,
      explanation: q.explanation,
      topic: q.topic,
      difficulty: q.difficulty,
      source: q.source,
      status: q.status,
      qualityScore: q.qualityScore,
      options: q.options.map((o: DbOption) => ({
        id: o.id,
        text: o.text,
        isCorrect: o.isCorrect,
      })),
    }));
  },

  /**
   * Create a new question with options
   */
  async create(input: QuestionInput): Promise<QuestionWithOptions> {
    const result = await db.transaction(async (tx) => {
      // Get valid topic or use default
      const validTopic = Topics.includes(input.topic as TopicType)
        ? (input.topic as TopicType)
        : Topics[0];

      // Get valid difficulty or use default
      const validDifficulty = Difficulties.includes(
        input.difficulty as DifficultyType
      )
        ? (input.difficulty as DifficultyType)
        : ("medium" as DifficultyType);

      // Get valid source or use default
      const validSource =
        input.source &&
        Object.values(SourceModels).includes(
          input.source.toLowerCase() as SourceModel
        )
          ? input.source.toLowerCase()
          : SourceModels.Manual;

      // Insert the question with id field
      const [questionResult] = await tx
        .insert(questions)
        .values({
          id: input.id || uuidv4(),
          uuid: uuidv4(),
          question: input.question,
          explanation: input.explanation,
          topic: validTopic,
          difficulty: validDifficulty,
          source: validSource,
          correctAnswer: input.options.find((o) => o.isCorrect)?.text || "",
          options: input.options.map((o) => o.text),
          qualityScore: input.qualityScore || 0,
          usageCount: 0,
          successRate: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Insert the options
      const optionsToInsert = input.options.map((option) => ({
        questionId: questionResult.id,
        text: option.text,
        isCorrect: option.isCorrect,
        createdAt: new Date(),
      }));

      const insertedOptions = await tx
        .insert(options)
        .values(optionsToInsert)
        .returning();

      // Return the created question with options
      return {
        id: questionResult.id,
        uuid: questionResult.uuid,
        question: questionResult.question,
        explanation: questionResult.explanation,
        topic: questionResult.topic,
        difficulty: questionResult.difficulty,
        options: insertedOptions.map((o) => ({
          id: o.id,
          text: o.text,
          isCorrect: o.isCorrect,
        })),
      };
    });

    return result;
  },

  /**
   * Update an existing question
   */
  async update(
    uuid: string,
    input: QuestionInput
  ): Promise<QuestionWithOptions> {
    const result = await db.transaction(async (tx) => {
      // Get the question first
      const existingQuestion = await tx.query.questions.findFirst({
        where: eq(questions.uuid, uuid),
      });

      if (!existingQuestion) {
        throw new Error("Question not found");
      }

      // Get valid topic or use default
      const validTopic = Topics.includes(input.topic as TopicType)
        ? (input.topic as TopicType)
        : Topics[0];

      // Get valid difficulty or use default
      const validDifficulty = Difficulties.includes(
        input.difficulty as DifficultyType
      )
        ? (input.difficulty as DifficultyType)
        : ("medium" as DifficultyType);

      // Update question
      const [updatedQuestion] = await tx
        .update(questions)
        .set({
          question: input.question,
          explanation: input.explanation,
          topic: validTopic,
          difficulty: validDifficulty,
          updatedAt: new Date(),
        })
        .where(eq(questions.uuid, uuid))
        .returning();

      // Delete existing options
      await tx
        .delete(options)
        .where(eq(options.questionId, existingQuestion.id));

      // Insert new options
      const optionsToInsert = input.options.map(
        (option: { text: string; isCorrect: boolean }) => ({
          questionId: existingQuestion.id,
          text: option.text,
          isCorrect: option.isCorrect,
          createdAt: new Date(),
        })
      );

      const insertedOptions = await tx
        .insert(options)
        .values(optionsToInsert)
        .returning();

      return {
        id: updatedQuestion.id,
        uuid: updatedQuestion.uuid,
        question: updatedQuestion.question,
        explanation: updatedQuestion.explanation,
        topic: updatedQuestion.topic,
        difficulty: updatedQuestion.difficulty,
        options: insertedOptions.map((o: DbOption) => ({
          id: o.id,
          text: o.text,
          isCorrect: o.isCorrect,
        })),
      };
    });

    return result;
  },

  /**
   * Delete a question by UUID
   */
  async delete(uuid: string): Promise<boolean> {
    const result = await db
      .delete(questions)
      .where(eq(questions.uuid, uuid))
      .returning();

    return result.length > 0;
  },

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalQuestions: number;
    byTopic: Record<string, number>;
    byDifficulty: Record<string, number>;
  }> {
    // Use the query API which is more stable
    const totalResult = await db.query.questions.findMany({
      columns: {
        id: true,
      },
    });
    const totalQuestions = totalResult.length;

    // Get all questions to count manually for topics
    const allQuestions = await db.query.questions.findMany({
      columns: {
        topic: true,
        difficulty: true,
      },
    });

    // Group by topic manually
    const byTopic: Record<string, number> = {};
    for (const q of allQuestions) {
      byTopic[q.topic] = (byTopic[q.topic] || 0) + 1;
    }

    // Group by difficulty manually
    const byDifficulty: Record<string, number> = {};
    for (const q of allQuestions) {
      byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;
    }

    return {
      totalQuestions,
      byTopic,
      byDifficulty,
    };
  },

  /**
   * Get all available topics
   */
  async getAllTopics(): Promise<string[]> {
    return Object.values(topicEnum.enumValues);
  },

  /**
   * Get all available difficulties
   */
  async getAllDifficulties(): Promise<string[]> {
    return Object.values(difficultyEnum.enumValues);
  },

  /**
   * Bulk insert questions (for seeding or importing)
   */
  async bulkInsert(questionsInput: QuestionInput[]): Promise<number> {
    let insertedCount = 0;

    await db.transaction(async (tx) => {
      for (const input of questionsInput) {
        // Get valid topic or use default
        const validTopic = Topics.includes(input.topic as TopicType)
          ? (input.topic as TopicType)
          : Topics[0];

        // Get valid difficulty or use default
        const validDifficulty = Difficulties.includes(
          input.difficulty as DifficultyType
        )
          ? (input.difficulty as DifficultyType)
          : ("medium" as DifficultyType);

        // Get valid source or use default
        const validSource =
          input.source &&
          Object.values(SourceModels).includes(
            input.source.toLowerCase() as SourceModel
          )
            ? input.source.toLowerCase()
            : SourceModels.Manual;

        // Insert the question with id field
        const [questionResult] = await tx
          .insert(questions)
          .values({
            id: input.id || uuidv4(),
            uuid: uuidv4(),
            question: input.question,
            explanation: input.explanation,
            topic: validTopic,
            difficulty: validDifficulty,
            source: validSource,
            correctAnswer: input.options.find((o) => o.isCorrect)?.text || "",
            options: input.options.map((o) => o.text),
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        // Insert the options
        const optionsToInsert = input.options.map((option) => ({
          questionId: questionResult.id,
          text: option.text,
          isCorrect: option.isCorrect,
          createdAt: new Date(),
        }));

        await tx.insert(options).values(optionsToInsert);
        insertedCount++;
      }
    });

    return insertedCount;
  },

  /**
   * Soft delete a question by setting its status to deleted
   */
  async softDelete(uuid: string): Promise<boolean> {
    const now = new Date();
    const result = await db
      .update(questions)
      .set({
        status: "deleted",
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(questions.uuid, uuid))
      .returning();

    return result.length > 0;
  },

  /**
   * Restore a soft-deleted question by setting its status back to active
   */
  async restore(uuid: string): Promise<boolean> {
    const result = await db
      .update(questions)
      .set({
        status: "active",
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(questions.uuid, uuid))
      .returning();

    return result.length > 0;
  },

  /**
   * Update question status (active, review, deleted)
   */
  async updateStatus(
    uuid: string,
    status: QuestionStatusType
  ): Promise<boolean> {
    const updates: Record<string, any> = {
      status,
      updatedAt: new Date(),
    };

    // Set deletedAt when status is deleted
    if (status === "deleted") {
      updates.deletedAt = new Date();
    } else if (status === "active") {
      updates.deletedAt = null;
    }

    const result = await db
      .update(questions)
      .set(updates)
      .where(eq(questions.uuid, uuid))
      .returning();

    return result.length > 0;
  },

  /**
   * Get questions by status
   */
  async getByStatus(
    status: QuestionStatusType,
    limit?: number
  ): Promise<QuestionWithOptions[]> {
    const result = await db.query.questions.findMany({
      where: eq(questions.status, status),
      with: {
        options: true,
      },
      orderBy: [desc(questions.createdAt)],
      limit: limit || 100,
    });

    return result.map((q: any) => ({
      id: q.id,
      uuid: q.uuid,
      question: q.question,
      explanation: q.explanation,
      topic: q.topic,
      difficulty: q.difficulty,
      source: q.source,
      status: q.status,
      qualityScore: q.qualityScore,
      options: q.options.map((o: DbOption) => ({
        id: o.id,
        text: o.text,
        isCorrect: o.isCorrect,
      })),
    }));
  },

  /**
   * Get questions that need review (model-generated with low quality score or flagged)
   */
  async getQuestionsForReview(limit?: number): Promise<QuestionWithOptions[]> {
    const result = await db.query.questions.findMany({
      where: and(
        inArray(questions.status, ["active", "review"]),
        or(eq(questions.source, "openai"), eq(questions.source, "claude")),
        lt(questions.qualityScore, 0.5)
      ),
      with: {
        options: true,
      },
      orderBy: [desc(questions.createdAt)],
      limit: limit || 100,
    });

    return result.map((q: any) => ({
      id: q.id,
      uuid: q.uuid,
      question: q.question,
      explanation: q.explanation,
      topic: q.topic,
      difficulty: q.difficulty,
      source: q.source,
      status: q.status,
      qualityScore: q.qualityScore,
      options: q.options.map((o: DbOption) => ({
        id: o.id,
        text: o.text,
        isCorrect: o.isCorrect,
      })),
    }));
  },
};

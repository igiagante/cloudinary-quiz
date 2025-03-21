// db/repositories/questionRepository.ts
import { eq, and, inArray, desc, sql, count } from "drizzle-orm";
import { db } from "../index";
import { questions, options, topicEnum, difficultyEnum } from "../schema";
import { v4 as uuidv4 } from "uuid";

export type QuestionWithOptions = {
  id: number;
  uuid: string;
  question: string;
  explanation: string;
  topic: string;
  difficulty: string;
  options: {
    id: number;
    text: string;
    isCorrect: boolean;
  }[];
};

export type QuestionInput = {
  question: string;
  explanation: string;
  topic: string;
  difficulty: string;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
};

export const questionRepository = {
  /**
   * Get all questions with their options
   */
  async getAll(): Promise<QuestionWithOptions[]> {
    const result = await db.query.questions.findMany({
      with: {
        options: true,
      },
      orderBy: [desc(questions.createdAt)],
    });

    return result.map((q) => ({
      id: q.id,
      uuid: q.uuid,
      question: q.question,
      explanation: q.explanation,
      topic: q.topic,
      difficulty: q.difficulty,
      options: q.options.map((o) => ({
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
      options: result.options.map((o) => ({
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
    limit?: number
  ): Promise<QuestionWithOptions[]> {
    const query = db.query.questions.findMany({
      where: and(
        topics.length > 0
          ? inArray(questions.topic, topics as any[])
          : undefined,
        difficulty ? eq(questions.difficulty, difficulty as any) : undefined
      ),
      with: {
        options: true,
      },
      orderBy: [sql`RANDOM()`],
      limit: limit || 100,
    });

    const result = await query;

    return result.map((q) => ({
      id: q.id,
      uuid: q.uuid,
      question: q.question,
      explanation: q.explanation,
      topic: q.topic,
      difficulty: q.difficulty,
      options: q.options.map((o) => ({
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
    return await db.transaction(async (tx) => {
      // Insert the question
      const [questionResult] = await tx
        .insert(questions)
        .values({
          uuid: uuidv4(),
          question: input.question,
          explanation: input.explanation,
          topic: input.topic as any,
          difficulty: input.difficulty as any,
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
  },

  /**
   * Update an existing question
   */
  async update(
    uuid: string,
    input: QuestionInput
  ): Promise<QuestionWithOptions> {
    return await db.transaction(async (tx) => {
      // Get the question first
      const existingQuestion = await tx.query.questions.findFirst({
        where: eq(questions.uuid, uuid),
      });

      if (!existingQuestion) {
        throw new Error("Question not found");
      }

      // Update question
      const [updatedQuestion] = await tx
        .update(questions)
        .set({
          question: input.question,
          explanation: input.explanation,
          topic: input.topic as any,
          difficulty: input.difficulty as any,
          updatedAt: new Date(),
        })
        .where(eq(questions.uuid, uuid))
        .returning();

      // Delete existing options
      await tx
        .delete(options)
        .where(eq(options.questionId, existingQuestion.id));

      // Insert new options
      const optionsToInsert = input.options.map((option) => ({
        questionId: existingQuestion.id,
        text: option.text,
        isCorrect: option.isCorrect,
        createdAt: new Date(),
      }));

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
        options: insertedOptions.map((o) => ({
          id: o.id,
          text: o.text,
          isCorrect: o.isCorrect,
        })),
      };
    });
  },

  /**
   * Delete a question by UUID
   */
  async delete(uuid: string): Promise<boolean> {
    const result = await db
      .delete(questions)
      .where(eq(questions.uuid, uuid))
      .returning({ id: questions.id });

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
    // Get total questions
    const [totalResult] = await db.select({ count: count() }).from(questions);
    const totalQuestions = Number(totalResult.count);

    // Get counts by topic
    const topicCounts = await db
      .select({
        topic: questions.topic,
        count: count(),
      })
      .from(questions)
      .groupBy(questions.topic);

    const byTopic: Record<string, number> = {};
    topicCounts.forEach((item) => {
      byTopic[item.topic] = Number(item.count);
    });

    // Get counts by difficulty
    const difficultyCounts = await db
      .select({
        difficulty: questions.difficulty,
        count: count(),
      })
      .from(questions)
      .groupBy(questions.difficulty);

    const byDifficulty: Record<string, number> = {};
    difficultyCounts.forEach((item) => {
      byDifficulty[item.difficulty] = Number(item.count);
    });

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
        // Insert the question
        const [questionResult] = await tx
          .insert(questions)
          .values({
            uuid: uuidv4(),
            question: input.question,
            explanation: input.explanation,
            topic: input.topic as any,
            difficulty: input.difficulty as any,
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
};

import { eq, inArray } from "drizzle-orm";
import { db, schema } from "./db";
import { log } from "./utils";

/**
 * Clean the database or specific parts of it
 * @param silent Whether to suppress console logs
 * @param topicId Optional topic ID to clean only questions for a specific topic
 */
export async function cleanDatabase(
  silent: boolean = false,
  topicId?: number
): Promise<void> {
  try {
    if (!silent) {
      log(
        topicId
          ? `Cleaning database for topic ID ${topicId}...`
          : "Cleaning entire database...",
        "blue"
      );
    }

    if (topicId) {
      // Find all questions with the specified topicId
      const topicQuestions = await db
        .select({ id: schema.questions.id })
        .from(schema.questions)
        .where(eq(schema.questions.topicId, topicId));

      const questionIds = topicQuestions.map((q) => q.id);

      if (questionIds.length > 0) {
        // Delete options for these questions
        await db
          .delete(schema.options)
          .where(inArray(schema.options.questionId, questionIds));
        if (!silent)
          log(
            `✓ Deleted options for ${questionIds.length} questions with topic ID ${topicId}`,
            "green"
          );

        // Delete the questions
        await db
          .delete(schema.questions)
          .where(eq(schema.questions.topicId, topicId));
        if (!silent)
          log(
            `✓ Deleted ${questionIds.length} questions with topic ID ${topicId}`,
            "green"
          );
      } else {
        if (!silent)
          log(`No questions found for topic ID ${topicId}`, "yellow");
      }
    } else {
      // Full database cleaning
      // Delete topic performance records
      await db.delete(schema.topicPerformance);
      if (!silent) log("✓ Deleted topic performance records", "green");

      // Delete user topic performance records
      await db.delete(schema.userTopicPerformance);
      if (!silent) log("✓ Deleted user topic performance records", "green");

      // Delete quiz questions
      await db.delete(schema.quizQuestions);
      if (!silent) log("✓ Deleted quiz questions", "green");

      // Delete options
      await db.delete(schema.options);
      if (!silent) log("✓ Deleted question options", "green");

      // Delete questions
      await db.delete(schema.questions);
      if (!silent) log("✓ Deleted questions", "green");
    }

    if (!silent) {
      log(
        topicId
          ? `✓ Topic ${topicId} data cleaned successfully`
          : "✓ Database cleaned successfully",
        "green"
      );
    }
  } catch (error) {
    log("✗ Error cleaning database:", "red");
    console.error(error);
    throw error;
  }
}

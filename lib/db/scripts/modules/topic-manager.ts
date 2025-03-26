import { parseTopics } from "../../parser/topic-parser";
import { db, schema } from "./db";
import { log, topicShortNames } from "./utils";

/**
 * Seed the topics table with data from topics.md
 */
export async function seedTopics(): Promise<void> {
  try {
    log("Seeding topics from topics.md...", "blue");

    const topicsData = parseTopics();
    let insertedCount = 0;

    // Insert each topic
    for (const topic of topicsData) {
      await db
        .insert(schema.topics)
        .values({
          id: topic.id,
          name: topic.name,
          maxPoints: topic.maxPoints,
          shortName: topicShortNames[topic.id] || `Topic${topic.id}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.topics.id,
          set: {
            name: topic.name,
            maxPoints: topic.maxPoints,
            shortName: topicShortNames[topic.id] || `Topic${topic.id}`,
            updatedAt: new Date(),
          },
        });

      insertedCount++;
    }

    log(`✓ Successfully seeded ${insertedCount} topics`, "green");
  } catch (error) {
    log("✗ Error seeding topics:", "red");
    console.error(error);
  }
}

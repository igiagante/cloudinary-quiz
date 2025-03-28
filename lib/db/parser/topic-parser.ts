import * as fs from "fs";
import * as path from "path";
import { TopicMetadata } from "@/lib/types";
import { Topic } from "@/types";

/**
 * Parses the topics.md file to extract topic metadata
 */
export function parseTopicsMetadata(): TopicMetadata[] {
  const topicsPath = path.join(process.cwd(), "lib/db/topics.md");
  const content = fs.readFileSync(topicsPath, "utf8");

  const topicsData: TopicMetadata[] = [];

  // Split content by topic sections
  const topicSections = content.split(/^# /m).filter(Boolean);

  for (const section of topicSections) {
    const lines = section.trim().split("\n");
    const name = lines[0].trim();

    let maxPoints = 0;
    let id = 0;

    // Parse metadata lines
    for (const line of lines.slice(1)) {
      if (line.startsWith("max_points:")) {
        maxPoints = parseFloat(line.replace("max_points:", "").trim());
      } else if (line.startsWith("id:")) {
        id = parseInt(line.replace("id:", "").trim());
      }
    }

    if (name && maxPoints && id) {
      topicsData.push({ name, maxPoints, id });
    }
  }

  // Sort by ID to ensure consistent order
  return topicsData.sort((a, b) => a.id - b.id);
}

/**
 * Calculates how many questions should be allocated to each topic
 * based on the max_points weighting
 */
export function distributeQuestionsByWeight(
  totalQuestions: number
): Record<number, number> {
  const topicsData = parseTopicsMetadata();
  const totalPoints = topicsData.reduce(
    (sum, topic) => sum + topic.maxPoints,
    0
  );
  const distribution: Record<number, number> = {};

  let allocatedQuestions = 0;

  // First pass - calculate raw distribution
  topicsData.forEach((topic) => {
    const proportion = topic.maxPoints / totalPoints;
    // Ensure at least 1 question per topic
    const topicQuestions = Math.max(1, Math.floor(totalQuestions * proportion));
    distribution[topic.id] = topicQuestions;
    allocatedQuestions += topicQuestions;
  });

  // Second pass - allocate any remaining questions to highest weighted topics
  const remaining = totalQuestions - allocatedQuestions;
  if (remaining > 0) {
    const sortedTopics = [...topicsData].sort(
      (a, b) => b.maxPoints - a.maxPoints
    );
    for (let i = 0; i < remaining; i++) {
      distribution[sortedTopics[i % sortedTopics.length].id]++;
    }
  }

  return distribution;
}

/**
 * This function parses topic strings and handles any conversion required
 * between the full topic names used in the UI and the database format.
 */
export function parseTopics(topics: string[]): string[] {
  if (!topics || !Array.isArray(topics) || topics.length === 0) {
    return [];
  }

  // Validate topics and ensure they're properly formatted
  return topics
    .map((topic) => {
      // Ensure the topic is trimmed and a valid string
      if (typeof topic === "string") {
        return topic.trim();
      }
      console.warn(`Invalid topic value: ${topic}`);
      return "";
    })
    .filter((topic) => topic !== "");
}

/**
 * Distribute questions based on topics and total question count
 */
export function distributeQuestionsByTopic(
  topics: string[],
  totalQuestions: number
): Record<string, number> {
  if (!topics || topics.length === 0) {
    return {};
  }

  const validTopics = parseTopics(topics);
  if (validTopics.length === 0) {
    return {};
  }

  // Create even distribution
  const distribution: Record<string, number> = {};

  // Minimum questions per topic
  const questionsPerTopic = Math.max(
    1,
    Math.floor(totalQuestions / validTopics.length)
  );

  // Assign base number to each topic
  validTopics.forEach((topic) => {
    distribution[topic] = questionsPerTopic;
  });

  // Distribute any remaining questions
  let remaining = totalQuestions - questionsPerTopic * validTopics.length;
  let index = 0;

  while (remaining > 0) {
    const topic = validTopics[index % validTopics.length];
    distribution[topic]++;
    remaining--;
    index++;
  }

  return distribution;
}

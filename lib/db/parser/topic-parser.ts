import * as fs from "fs";
import * as path from "path";
import { TopicMetadata } from "@/lib/types";

/**
 * Parses the topics.md file to extract topic metadata
 */
export function parseTopics(): TopicMetadata[] {
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
export function distributeQuestionsByTopic(
  totalQuestions: number
): Record<number, number> {
  const topicsData = parseTopics();
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

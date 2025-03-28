import { debug } from "@/lib/debug";

/**
 * Service for mapping arbitrary topic names to standardized enum values
 */
export class TopicMapperService {
  /**
   * Maps a topic name to a valid enum value
   */
  mapToValidTopicEnum(topic: string): string {
    // Map full topic names to the enum values required by the database
    if (
      topic.includes("Products") ||
      topic.includes("Value") ||
      topic.includes("Environment")
    )
      return "Products";
    if (topic.includes("Architecture")) return "Architecture";
    if (topic.includes("Lifecycle") || topic.includes("Emerging"))
      return "Lifecycle";
    if (
      topic.includes("Widget") ||
      topic.includes("Add-on") ||
      topic.includes("Integration")
    )
      return "Widgets";
    if (
      topic.includes("Upload") ||
      topic.includes("Migrate") ||
      topic.includes("Asset")
    )
      return "Assets";
    if (topic.includes("Transform")) return "Transformations";
    if (topic.includes("Media") || topic.includes("Management"))
      return "Management";
    if (
      topic.includes("User") ||
      topic.includes("Role") ||
      topic.includes("Access") ||
      topic.includes("Control")
    )
      return "Access";

    // Default fallback
    debug.warn(
      `Could not map topic: ${topic} to valid enum value, using default "Products"`
    );
    return "Products";
  }

  /**
   * Detects duplicate topics after mapping and returns them
   */
  detectDuplicateTopics(mappedTopics: string[]): {
    hasDuplicates: boolean;
    duplicates: string[];
  } {
    const uniqueMappedTopics = [...new Set(mappedTopics)];
    const hasDuplicates = mappedTopics.length !== uniqueMappedTopics.length;

    let duplicates: string[] = [];
    if (hasDuplicates) {
      duplicates = mappedTopics.filter(
        (item, index) => mappedTopics.indexOf(item) !== index
      );
    }

    return {
      hasDuplicates,
      duplicates,
    };
  }
}

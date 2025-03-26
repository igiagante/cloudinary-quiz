// ANSI color codes for prettier console output
export const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

/**
 * Log a message with color
 */
export function log(
  message: string,
  color: keyof typeof colors = "reset"
): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Helper function to get topic name from ID
 */
export function getTopic(topicId: number): string {
  const topics = {
    1: "Products & Value",
    2: "Architecture",
    3: "Media Lifecycle",
    4: "Integrations",
    5: "Upload & Transformations",
    6: "Transformations",
    7: "Media Management",
    8: "User Management",
  };
  return topics[topicId as keyof typeof topics] || "Unknown";
}

/**
 * Map full topic names to short names for enum compatibility
 */
export const topicShortNames: Record<number, string> = {
  1: "Products",
  2: "Architecture",
  3: "Lifecycle",
  4: "Widgets",
  5: "Assets",
  6: "Transformations",
  7: "Management",
  8: "Access",
};

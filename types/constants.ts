// types/constants.ts
import { Topic } from "./index";

export const DifficultyLevels = {
  easy: "easy",
  medium: "medium",
  hard: "hard",
  mixed: "mixed",
} as const;

export type DifficultyLevel =
  (typeof DifficultyLevels)[keyof typeof DifficultyLevels];

export const ModelTypes = {
  claude: "claude",
  openai: "openai",
  none: "none",
} as const;

export type ModelType = (typeof ModelTypes)[keyof typeof ModelTypes];

export const QuestionSources = {
  claude: "claude",
  openai: "openai",
  manual: "manual",
} as const;

export type QuestionSource =
  (typeof QuestionSources)[keyof typeof QuestionSources];

// Cloudinary Topics - Mapped to certification exam topics
export const cloudinaryTopics: Record<Topic, string[]> = {
  "Products, Value, Environment Settings, and Implementation Strategies": [
    "Product offerings and value proposition",
    "Environment variables and account settings",
    "Implementation best practices",
    "Product capabilities and limitations",
    "Configuration options",
    "URL structure and transformation order",
  ],
  "System Architecture": [
    "Authentication methods",
    "API integration patterns",
    "Upload workflows",
    "Delivery options",
    "CDN configurations",
    "Signed URLs",
    "Private CDNs",
    "Custom domains",
  ],
  "Media Lifecycle Strategy and Emerging Trends": [
    "Asset lifecycle management",
    "Asset versioning",
    "Content freshness strategies",
    "Content expiration",
    "Adaptive streaming",
    "AI capabilities",
    "Responsive design strategies",
  ],
  "Widgets, Out of Box Add-ons, Custom Integrations": [
    "Upload widget",
    "Media library widget",
    "Video player",
    "Product gallery",
    "CMS integrations",
    "E-commerce platform integrations",
    "Add-on capabilities",
    "Customization options",
  ],
  "Upload and Migrate Assets": [
    "Upload API",
    "Upload methods",
    "Upload presets",
    "Migration strategies",
    "Asset structure planning",
    "Bulk upload options",
    "Remote fetch",
    "Auto-tagging",
  ],
  Transformations: [
    "Image transformations",
    "Video transformations",
    "Named transformations",
    "Chained transformations",
    "Conditional transformations",
    "Format and quality optimizations",
    "Responsive breakpoints",
    "Cropping and resizing strategies",
  ],
  "Media Management": [
    "Asset organization",
    "Structured metadata",
    "Tags and categories",
    "Search capabilities",
    "Access control",
    "AI categorization",
    "Moderation workflows",
  ],
  "User, Role, and Group Management and Access Controls": [
    "User management",
    "Role-based access control",
    "Permission sets",
    "Sub-accounts",
    "Project segregation",
    "Collaborative workflows",
    "Access restrictions",
  ],
};

export const cloudinaryTopicList: Topic[] = Object.keys(
  cloudinaryTopics
) as Topic[];

// Subtopics flattened for question generation
export const cloudinarySubtopics = Object.entries(cloudinaryTopics).flatMap(
  ([topic, subtopics]) =>
    subtopics.map((subtopic) => ({
      topic: topic as Topic,
      subtopic,
    }))
);

// Key concepts that might appear in questions
export const cloudinaryKeyConcepts = {
  delivery_types: [
    "http",
    "https",
    "shared CDN",
    "private CDN",
    "custom domain",
  ],
  transformation_parameters: ["w", "h", "c", "g", "e", "l", "f", "q", "dpr"],
  upload_options: ["unsigned", "signed", "authenticated", "direct", "remote"],
  video_formats: ["mp4", "webm", "ogv", "mov", "flv"],
  image_formats: ["jpg", "png", "gif", "webp", "avif", "svg"],
  crop_modes: ["fill", "fit", "limit", "mfit", "pad", "scale", "crop", "thumb"],
  gravity_options: [
    "auto",
    "face",
    "faces",
    "center",
    "north",
    "south",
    "east",
    "west",
  ],
};

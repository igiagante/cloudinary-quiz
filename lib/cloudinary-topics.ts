// lib/cloudinary-topics.ts
import { Topic } from "@/types";

export const CLOUDINARY_TOPICS: Record<Topic, string[]> = {
  "Cloudinary Basics": [
    "Cloudinary architecture",
    "Cloud-based vs on-premise solutions",
    "Core services (storage, manipulation, optimization, delivery)",
    "Cloudinary pricing models",
    "Cloudinary account structure",
  ],
  "Image Optimization": [
    "Automatic format selection (f_auto)",
    "Quality optimization (q_auto)",
    "Responsive images",
    "Lazy loading",
    "Progressive loading",
    "WebP and AVIF support",
    "DPR settings",
  ],
  "Video Processing": [
    "Video transcoding",
    "Adaptive streaming (HLS/DASH)",
    "Video optimization",
    "Video transformations",
    "Video player integration",
    "Video analytics",
  ],
  "Asset Management": [
    "Media library",
    "Folders and collections",
    "Tags and metadata",
    "Search capabilities",
    "Asset versioning",
    "Image moderation",
  ],
  Transformations: [
    "URL-based transformations",
    "Chained transformations",
    "Named transformations",
    "Cropping modes",
    "Filters and effects",
    "Text and image overlays",
    "Face detection",
  ],
  "Upload API": [
    "Upload methods",
    "Upload presets",
    "Auto-tagging",
    "Background removal",
    "Direct upload from browser",
    "Signed uploads",
    "Upload widget",
  ],
  "Admin API": [
    "Resource management",
    "Transformation management",
    "Usage reports",
    "User management",
    "Webhook configuration",
    "Resource deletion",
    "Folders management",
  ],
  "Security Features": [
    "Signed URLs",
    "Upload restrictions",
    "Access control",
    "Authentication methods",
    "Secure delivery",
    "Resource restrictions",
  ],
  "Performance Optimization": [
    "Content Delivery Networks (CDNs)",
    "Caching strategies",
    "Transformation caching",
    "Global distribution",
    "Origin shielding",
    "Fetch optimization",
  ],
  "SDKs and Integration": [
    "JavaScript SDK",
    "React SDK",
    "Node.js integration",
    "Frontend frameworks integration",
    "Backend frameworks integration",
    "CMS plugins",
    "Mobile SDKs",
  ],
};

export const CLOUDINARY_TOPIC_LIST: Topic[] = Object.keys(
  CLOUDINARY_TOPICS
) as Topic[];

// Subtopics flattened for question generation
export const CLOUDINARY_SUBTOPICS = Object.entries(CLOUDINARY_TOPICS).flatMap(
  ([topic, subtopics]) =>
    subtopics.map((subtopic) => ({
      topic: topic as Topic,
      subtopic,
    }))
);

// Key concepts that might appear in questions
export const CLOUDINARY_KEY_CONCEPTS = {
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

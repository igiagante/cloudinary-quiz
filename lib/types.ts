// Define the possible topics
export type TopicType =
  | "Cloudinary Basics"
  | "SDKs and Integration"
  | "Transformations"
  | "Performance Optimization"
  | "Asset Management"
  | "Security Features"
  | "Image Optimization"
  | "Video Processing"
  | "Upload and Delivery"
  | "Analytics and Monitoring";

// Define the possible difficulty levels
export type Difficulty = "easy" | "medium" | "hard";

// Topic metadata for the certification exam
export interface TopicMetadata {
  id: number;
  name: string;
  maxPoints: number;
}

// Topic score with results
export interface TopicScore extends TopicMetadata {
  earnedPoints: number;
  percentage: number;
}

// Answer interface for quiz responses
export interface Answer {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
}

// Basic question interface
export interface QuizQuestion {
  number: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  correctAnswerIndices?: number[];
  hasMultipleCorrectAnswers: boolean;
  topicId: number;
  difficulty: string;
  source: string;
  explanation: string | null;
}

// types/index.ts

export type Topic =
  | "Cloudinary Basics"
  | "Image Optimization"
  | "Video Processing"
  | "Asset Management"
  | "Transformations"
  | "Upload API"
  | "Admin API"
  | "Security Features"
  | "Performance Optimization"
  | "SDKs and Integration";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic: Topic;
  difficulty: "easy" | "medium" | "hard";
}

export interface QuizState {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  userAnswers: Record<string, string>;
  isComplete: boolean;
}

export interface TopicPerformance {
  topic: Topic;
  correct: number;
  total: number;
  percentage: number;
}

export interface QuizResults {
  score: {
    correct: number;
    total: number;
    percentage: number;
  };
  passed: boolean;
  topicBreakdown: TopicPerformance[];
  improvementAreas: Topic[];
  strengths: Topic[];
}

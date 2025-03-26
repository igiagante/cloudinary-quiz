// types/index.ts
import { DifficultyLevel, QuestionSource } from "./constants";
import { TopicScore } from "@/lib/types";

export type Topic =
  | "Products, Value, Environment Settings, and Implementation Strategies"
  | "System Architecture"
  | "Media Lifecycle Strategy and Emerging Trends"
  | "Widgets, Out of Box Add-ons, Custom Integrations"
  | "Upload and Migrate Assets"
  | "Transformations"
  | "Media Management"
  | "User, Role, and Group Management and Access Controls";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  correctAnswers?: string[];
  hasMultipleCorrectAnswers?: boolean;
  explanation: string;
  topic: Topic;
  difficulty: DifficultyLevel;
  source?: QuestionSource;
  qualityScore?: number;
}

export interface QuizState {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  userAnswers: Record<string, string | string[]>;
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
  topicScores?: TopicScore[];
}

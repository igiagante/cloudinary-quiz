// db/schema.ts - Adding user schema and connecting it with quizzes

import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
  uuid,
  real,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { nanoid } from "nanoid";

// Existing enums
export const topicEnum = pgEnum("topic", [
  "Products",
  "Architecture",
  "Lifecycle",
  "Widgets",
  "Assets",
  "Transformations",
  "Management",
  "Access",
]);

// Topics table for certification exam structure
export const topics = pgTable("topics", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  maxPoints: real("max_points").notNull(),
  shortName: text("short_name").notNull(), // Short name for enum compatibility
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);

// Add source model enum
export const sourceModelEnum = pgEnum("source_model", [
  "openai",
  "claude",
  "manual",
]);

// Add status enum for questions
export const questionStatusEnum = pgEnum("question_status", [
  "active",
  "review",
  "deleted",
]);

// New user table
export const users = pgTable("users", {
  id: varchar("id", { length: 128 }).primaryKey().notNull(),
  email: varchar("email", { length: 255 }).unique(), // Optional for anonymous users
  name: varchar("name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  isAnonymous: boolean("is_anonymous").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at").defaultNow().notNull(),
});

// Questions table (updated)
export const questions = pgTable("questions", {
  id: varchar("id", { length: 21 })
    .primaryKey()
    .notNull()
    .$defaultFn(() => nanoid()),
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // Array of possible answers
  correctAnswer: text("correctAnswer").notNull(),
  explanation: text("explanation").notNull(),
  topic: text("topic").notNull(),
  difficulty: text("difficulty").notNull(), // 'easy', 'medium', 'hard'
  source: text("source").default("manual"), // 'openai', 'claude', 'manual'
  topicId: integer("topic_id"), // Exam topic ID (1-8)
  pointValue: real("point_value"), // Point value for this question in exam scoring
  status: text("status").default("active").notNull(), // 'active', 'review', 'deleted'
  deletedAt: timestamp("deleted_at"),
  hasMultipleCorrectAnswers: boolean("has_multiple_correct_answers").default(
    false
  ),
  correctAnswers: text("correct_answers").array(),
  qualityScore: real("quality_score").default(0),
  usageCount: integer("usage_count").default(0),
  positiveRatings: integer("positive_ratings").default(0),
  feedbackCount: integer("feedback_count").default(0),
  successRate: real("success_rate").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Options table (existing)
export const options = pgTable("options", {
  id: serial("id").primaryKey(),
  questionId: varchar("question_id", { length: 21 })
    .references(() => questions.id, { onDelete: "cascade" })
    .notNull(),
  text: text("text").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Update quizzes table to reference user
export const quizzes = pgTable("quizzes", {
  id: varchar("id", { length: 21 })
    .primaryKey()
    .notNull()
    .$defaultFn(() => nanoid()),
  userId: varchar("user_id", { length: 128 })
    .notNull()
    .references(() => users.id),
  numQuestions: integer("num_questions").notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  score: integer("score"),
  passPercentage: integer("pass_percentage").default(80).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Existing tables
export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: varchar("quiz_id", { length: 21 })
    .references(() => quizzes.id)
    .notNull(),
  questionId: varchar("question_id", { length: 21 })
    .references(() => questions.id)
    .notNull(),
  userAnswer: integer("user_answer").references(() => options.id),
  isCorrect: boolean("is_correct"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const topicPerformance = pgTable("topic_performance", {
  id: serial("id").primaryKey(),
  quizId: varchar("quiz_id", { length: 21 })
    .references(() => quizzes.id, { onDelete: "cascade" })
    .notNull(),
  topic: topicEnum("topic").notNull(),
  correct: integer("correct").notNull(),
  total: integer("total").notNull(),
  percentage: integer("percentage").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User-specific performance tracking over time
export const userTopicPerformance = pgTable("user_topic_performance", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 21 })
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  topic: topicEnum("topic").notNull(),
  totalQuizzes: integer("total_quizzes").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  percentage: integer("percentage").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  quizzes: many(quizzes),
  topicPerformance: many(userTopicPerformance),
}));

export const questionsRelations = relations(questions, ({ many, one }) => ({
  options: many(options),
  quizQuestions: many(quizQuestions),
  topic: one(topics, {
    fields: [questions.topicId],
    references: [topics.id],
  }),
}));

export const optionsRelations = relations(options, ({ one }) => ({
  question: one(questions, {
    fields: [options.questionId],
    references: [questions.id],
  }),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  user: one(users, {
    fields: [quizzes.userId],
    references: [users.id],
  }),
  quizQuestions: many(quizQuestions),
  topicPerformance: many(topicPerformance),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizQuestions.quizId],
    references: [quizzes.id],
  }),
  question: one(questions, {
    fields: [quizQuestions.questionId],
    references: [questions.id],
  }),
}));

export const topicPerformanceRelations = relations(
  topicPerformance,
  ({ one }) => ({
    quiz: one(quizzes, {
      fields: [topicPerformance.quizId],
      references: [quizzes.id],
    }),
  })
);

export const userTopicPerformanceRelations = relations(
  userTopicPerformance,
  ({ one }) => ({
    user: one(users, {
      fields: [userTopicPerformance.userId],
      references: [users.id],
    }),
  })
);

// Add topic relations
export const topicsRelations = relations(topics, ({ many }) => ({
  questions: many(questions),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;

export type Option = typeof options.$inferSelect;
export type NewOption = typeof options.$inferInsert;

export type Quiz = typeof quizzes.$inferSelect;
export type NewQuiz = typeof quizzes.$inferInsert;

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type NewQuizQuestion = typeof quizQuestions.$inferInsert;

export type TopicPerformance = typeof topicPerformance.$inferSelect;
export type NewTopicPerformance = typeof topicPerformance.$inferInsert;

export type UserTopicPerformance = typeof userTopicPerformance.$inferSelect;
export type NewUserTopicPerformance = typeof userTopicPerformance.$inferInsert;

export type Topic = typeof topics.$inferSelect;
export type NewTopic = typeof topics.$inferInsert;

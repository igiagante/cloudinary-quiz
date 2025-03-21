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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Existing enums
export const topicEnum = pgEnum("topic", [
  "Cloudinary Basics",
  "Image Optimization",
  "Video Processing",
  "Asset Management",
  "Transformations",
  "Upload API",
  "Admin API",
  "Security Features",
  "Performance Optimization",
  "SDKs and Integration",
]);

export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);

// New user table
export const users = pgTable("users", {
  id: text("id").primaryKey().notNull(),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(),
  email: varchar("email", { length: 255 }).unique(), // Optional for anonymous users
  name: varchar("name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  isAnonymous: boolean("is_anonymous").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at").defaultNow().notNull(),
});

// Questions table (existing)
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(),
  question: text("question").notNull(),
  explanation: text("explanation").notNull(),
  topic: topicEnum("topic").notNull(),
  difficulty: difficultyEnum("difficulty").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Options table (existing)
export const options = pgTable("options", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id")
    .references(() => questions.id, { onDelete: "cascade" })
    .notNull(),
  text: text("text").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Update quizzes table to reference user
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(),
  userId: text("user_id").references(() => users.id), // Can be null for anonymous quizzes
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
  quizId: integer("quiz_id")
    .references(() => quizzes.id)
    .notNull(),
  questionId: integer("question_id")
    .references(() => questions.id)
    .notNull(),
  userAnswer: integer("user_answer").references(() => options.id),
  isCorrect: boolean("is_correct"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const topicPerformance = pgTable("topic_performance", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id")
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
  userId: text("user_id")
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

export const questionsRelations = relations(questions, ({ many }) => ({
  options: many(options),
  quizQuestions: many(quizQuestions),
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

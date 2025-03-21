// db/schema.ts
import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
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

// Questions table
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

// Options table
export const options = pgTable("options", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id")
    .references(() => questions.id, { onDelete: "cascade" })
    .notNull(),
  text: text("text").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Quizzes table
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(),
  userId: varchar("user_id", { length: 255 }),
  numQuestions: integer("num_questions").notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  score: integer("score"),
  passPercentage: integer("pass_percentage").default(80).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// QuizQuestions join table
export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id")
    .references(() => quizzes.id, { onDelete: "cascade" })
    .notNull(),
  questionId: integer("question_id")
    .references(() => questions.id, { onDelete: "cascade" })
    .notNull(),
  userAnswer: integer("user_answer").references(() => options.id),
  isCorrect: boolean("is_correct"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Topic Performance table for analytics
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

// Relations
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

export const quizzesRelations = relations(quizzes, ({ many }) => ({
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

// Types
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

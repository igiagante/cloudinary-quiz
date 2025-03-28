DO $$ BEGIN
 CREATE TYPE "difficulty" AS ENUM('easy', 'medium', 'hard');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "question_status" AS ENUM('active', 'review', 'deleted');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "source_model" AS ENUM('openai', 'claude', 'manual');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "topic" AS ENUM('Products', 'Architecture', 'Lifecycle', 'Widgets', 'Assets', 'Transformations', 'Management', 'Access');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "options" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" varchar(21) NOT NULL,
	"text" text NOT NULL,
	"is_correct" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "questions" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"options" jsonb NOT NULL,
	"correctAnswer" text NOT NULL,
	"explanation" text NOT NULL,
	"topic" text NOT NULL,
	"difficulty" text NOT NULL,
	"source" text DEFAULT 'manual',
	"topic_id" integer,
	"point_value" real,
	"status" text DEFAULT 'active' NOT NULL,
	"deleted_at" timestamp,
	"has_multiple_correct_answers" boolean DEFAULT false,
	"correct_answers" text[],
	"quality_score" real DEFAULT 0,
	"usage_count" integer DEFAULT 0,
	"positive_ratings" integer DEFAULT 0,
	"feedback_count" integer DEFAULT 0,
	"success_rate" real DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quiz_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_id" varchar(21) NOT NULL,
	"question_id" varchar(21) NOT NULL,
	"user_answer" integer,
	"is_correct" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quizzes" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"num_questions" integer NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"score" integer,
	"pass_percentage" integer DEFAULT 80 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "topic_performance" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_id" varchar(21) NOT NULL,
	"topic" "topic" NOT NULL,
	"correct" integer NOT NULL,
	"total" integer NOT NULL,
	"percentage" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "topics" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"max_points" real NOT NULL,
	"short_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_topic_performance" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"topic" "topic" NOT NULL,
	"total_quizzes" integer NOT NULL,
	"total_questions" integer NOT NULL,
	"correct_answers" integer NOT NULL,
	"percentage" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"email" varchar(255),
	"name" varchar(255),
	"avatar_url" text,
	"is_anonymous" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "options" ADD CONSTRAINT "options_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_user_answer_options_id_fk" FOREIGN KEY ("user_answer") REFERENCES "options"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "topic_performance" ADD CONSTRAINT "topic_performance_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_topic_performance" ADD CONSTRAINT "user_topic_performance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

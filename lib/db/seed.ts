// scripts/seed.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { questions, options, users } from "./schema";
import { OpenAI } from "openai";
import { sql, count } from "drizzle-orm";
import {
  CLOUDINARY_TOPICS,
  CLOUDINARY_TOPIC_LIST,
} from "@/lib/cloudinary-topics";
import { v4 as uuidv4 } from "uuid";
import "dotenv/config";
import { config } from "dotenv";
import path from "path";

// Load environment variables from .env.local
config({
  path: path.resolve(process.cwd(), ".env.local"),
});

// Create a new connection for the script
const client = postgres(process.env.POSTGRES_URL!, {
  ssl: false,
});
const db = drizzle(client);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to create a test user for seeding
async function createTestUser() {
  const [{ count: userCount }] = await db
    .select({ count: count() })
    .from(users);

  if (Number(userCount) > 0) {
    console.log("Users already exist, skipping test user creation");
    return;
  }

  console.log("Creating test user...");
  const [user] = await db
    .insert(users)
    .values({
      id: uuidv4(),
      uuid: uuidv4(),
      email: "test@example.com",
      name: "Test User",
      isAnonymous: false,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    })
    .returning();

  console.log(`Created test user with ID: ${user.id}`);
  return user;
}

async function seedDatabase() {
  console.log("Starting database seeding...");

  // Create a test user
  const testUser = await createTestUser();

  if (!testUser) {
    console.error("Failed to create test user");
    return;
  }

  console.log(`Test user created: ${testUser.id}`);

  // Check if we already have questions
  const [questionCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(questions);
  const totalQuestions = Number(questionCount.count) || 0;

  if (totalQuestions > 0) {
    console.log(
      `Database already contains ${totalQuestions} questions. Skipping seeding.`
    );
    console.log("If you want to add more questions, use the admin interface.");
    return;
  }

  // Generate base questions for each topic
  const questionsPerTopic = 2; // Keep low for testing
  const difficultyLevels: ("easy" | "medium" | "hard")[] = ["easy", "medium"];

  for (const topic of CLOUDINARY_TOPIC_LIST) {
    console.log(`Generating questions for topic: ${topic}`);

    for (const difficulty of difficultyLevels) {
      console.log(`  - Difficulty: ${difficulty}`);

      try {
        const generatedQuestions = await generateQuestionsForTopic(
          topic,
          questionsPerTopic,
          difficulty
        );

        // Save questions to database
        for (const question of generatedQuestions) {
          // 1. Insert the question
          const [insertedQuestion] = await db
            .insert(questions)
            .values({
              uuid: uuidv4(),
              question: question.question,
              explanation: question.explanation,
              topic: topic as any,
              difficulty: difficulty as any,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();

          console.log(`    - Added question ID: ${insertedQuestion.id}`);

          // 2. Insert the options
          const correctIndex = question.options.findIndex(
            (opt) => opt === question.correctAnswer
          );

          const optionsToInsert = question.options.map((optionText, index) => ({
            questionId: insertedQuestion.id,
            text: optionText,
            isCorrect: index === correctIndex,
            createdAt: new Date(),
          }));

          await db.insert(options).values(optionsToInsert);
        }
      } catch (error) {
        console.error(
          `Error generating questions for ${topic} (${difficulty}):`,
          error
        );
      }
    }
  }

  // Get final stats
  const [finalQuestionCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(questions);
  console.log(
    `Seeding complete. Database now contains ${Number(
      finalQuestionCount.count
    )} questions.`
  );
}

async function generateQuestionsForTopic(
  topic: string,
  count: number,
  difficulty: "easy" | "medium" | "hard"
): Promise<
  Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    topic: string;
    difficulty: string;
  }>
> {
  const topicDetails =
    CLOUDINARY_TOPICS[topic as keyof typeof CLOUDINARY_TOPICS] || [];

  const systemPrompt = `
  You are a world-class Cloudinary certification expert and technical trainer with extensive experience preparing developers for the Cloudinary certification exam. Your specialty is crafting precise, challenging, and realistic multiple-choice questions that thoroughly test a candidate's understanding of Cloudinary's platform, features, and best practices.

  Your questions must be:
  1) Indistinguishable from official certification questions
  2) Technically accurate and current with Cloudinary's latest features
  3) Focused on practical application rather than theory
  4) Designed to test deep understanding, not memorization
  5) Written clearly with unambiguous wording

  For each question you generate:
  - Include exactly 4 options (A, B, C, D) with only one correct answer
  - Ensure distractors (wrong answers) are plausible but clearly incorrect upon careful examination
  - Write a comprehensive explanation for why the correct answer is right
  - When relevant, include code examples, URL transformation strings, or API references

  Always return data in the specified JSON format with no markdown or additional text.`;

  const userPrompt = `
  Generate ${count} Cloudinary certification quiz questions matching these criteria:

  - Topic: ${topic}
  - Difficulty: ${difficulty}
  - Focus on practical, real-world implementation scenarios

  Specifically focus on these subtopics for ${topic}:
  ${topicDetails.map((st) => `- ${st}`).join("\n")}

  Return JSON formatted as:
  {
    "questions": [
      {
        "question": "Full question text with appropriate context",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswerIndex": 0,
        "explanation": "Detailed explanation of the correct answer"
      }
    ]
  }`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const rawOutput = response.choices[0].message.content;
  if (!rawOutput) throw new Error("No content in response");

  const parsedOutput = JSON.parse(rawOutput);

  if (!parsedOutput.questions || !Array.isArray(parsedOutput.questions)) {
    throw new Error("Invalid response format");
  }

  return parsedOutput.questions.map((q: any) => ({
    question: q.question,
    options: q.options,
    correctAnswer: q.options[q.correctAnswerIndex],
    explanation: q.explanation,
    topic: topic,
    difficulty: difficulty,
  }));
}

// Run the seed script
seedDatabase()
  .then(() => {
    console.log("Seed script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed script failed:", error);
    process.exit(1);
  });

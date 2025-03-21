// lib/quiz-generator.ts
import { OpenAI } from "openai";
import { z } from "zod";
import { CLOUDINARY_TOPICS, CLOUDINARY_TOPIC_LIST } from "./cloudinary-topics";
import { QuizQuestion, Topic } from "@/types";
import { v4 as uuidv4 } from "uuid";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define schema for structured output
const questionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctAnswerIndex: z.number().min(0).max(3),
  explanation: z.string(),
  topic: z.string().optional(),
  subtopic: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  tags: z.array(z.string()).optional(),
});

const questionsArraySchema = z.object({
  questions: z.array(questionSchema),
});

export async function generateQuizQuestions(
  numQuestions: number = 10,
  topics?: Topic[],
  difficulty?: "easy" | "medium" | "hard"
): Promise<QuizQuestion[]> {
  // If no specific topics are provided, randomly select from all topics
  const selectedTopics =
    topics || generateRandomTopics(Math.min(numQuestions, 5));

  // Create a balanced distribution of questions across selected topics
  const topicDistribution = createTopicDistribution(
    selectedTopics,
    numQuestions
  );

  // Generate prompts and collect results
  const questions: QuizQuestion[] = [];

  for (const [topic, count] of Object.entries(topicDistribution)) {
    const topicQuestions = await generateQuestionsForTopic(
      topic as Topic,
      count,
      difficulty
    );
    questions.push(...topicQuestions);
  }

  // Shuffle questions for random order
  return shuffleArray(questions);
}

function generateRandomTopics(count: number): Topic[] {
  const shuffled = [...CLOUDINARY_TOPIC_LIST].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function createTopicDistribution(
  topics: Topic[],
  totalQuestions: number
): Record<Topic, number> {
  const distribution: Record<Topic, number> = {} as Record<Topic, number>;

  // Initialize with at least one question per topic
  topics.forEach((topic) => {
    distribution[topic] = 1;
  });

  // Distribute remaining questions relatively evenly
  let remainingQuestions = totalQuestions - topics.length;
  let currentIndex = 0;

  while (remainingQuestions > 0) {
    distribution[topics[currentIndex % topics.length]]++;
    currentIndex++;
    remainingQuestions--;
  }

  return distribution;
}

async function generateQuestionsForTopic(
  topic: Topic,
  count: number,
  difficulty?: "easy" | "medium" | "hard"
): Promise<QuizQuestion[]> {
  const topicDetails = CLOUDINARY_TOPICS[topic];
  const difficultyLevel =
    difficulty ||
    (["easy", "medium", "hard"][Math.floor(Math.random() * 3)] as
      | "easy"
      | "medium"
      | "hard");

  try {
    // This is where we use the advanced prompt
    const systemPrompt = `
    You are a world-class Cloudinary certification expert and technical trainer with extensive experience preparing developers for the Cloudinary certification exam. Your specialty is crafting precise, challenging, and realistic multiple-choice questions that thoroughly test a candidate's understanding of Cloudinary's platform, features, and best practices.

    Your questions must be:
    1) Indistinguishable from official certification questions
    2) Technically accurate and current with Cloudinary's latest features
    3) Focused on practical application rather than theory
    4) Designed to test deep understanding, not memorization
    5) Written clearly with unambiguous wording
    6) Balanced across difficulty levels with appropriate distractors

    For each question you generate:
    - Include exactly 4 options (A, B, C, D) with only one correct answer
    - Ensure distractors (wrong answers) are plausible but clearly incorrect upon careful examination
    - Write a comprehensive explanation for why the correct answer is right AND why each incorrect option is wrong
    - Tag with appropriate topic, subtopic, and difficulty level
    - When relevant, include code examples, URL transformation strings, or API references

    Always return data in the specified JSON format with no markdown or additional text.`;

    const userPrompt = `
    Generate ${count} Cloudinary certification quiz questions matching these criteria:

    - Topic(s): ${topic}
    - Difficulty: ${difficultyLevel}
    - Focus on practical, real-world implementation scenarios
    - Include a mix of conceptual and technical questions
    - Cover both fundamental concepts and edge cases
    - Test understanding of best practices and optimization techniques

    Specifically focus on these subtopics for ${topic}:
    ${topicDetails.map((st) => `- ${st}`).join("\n")}

    Return JSON formatted as:
    {
      "questions": [
        {
          "question": "Full question text with appropriate context and code examples if relevant",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswerIndex": 0,
          "explanation": "Detailed explanation of the correct answer and why other options are incorrect",
          "topic": "${topic}",
          "subtopic": "Specific subtopic",
          "difficulty": "${difficultyLevel}"
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
    const validatedData = questionsArraySchema.parse(parsedOutput);

    return validatedData.questions.map((q) => ({
      id: uuidv4(),
      question: q.question,
      options: q.options,
      correctAnswer: q.options[q.correctAnswerIndex],
      explanation: q.explanation,
      topic: topic, // Ensure we use the original topic
      difficulty: difficultyLevel,
    }));
  } catch (error) {
    console.error(`Error generating questions for ${topic}:`, error);
    return [];
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Utility function to analyze quiz results
export function analyzeQuizResults(
  questions: QuizQuestion[],
  userAnswers: Record<string, string>
): {
  score: { correct: number; total: number; percentage: number };
  topicPerformance: Record<
    Topic,
    { correct: number; total: number; percentage: number }
  >;
  passed: boolean;
  improvementAreas: Topic[];
  strengths: Topic[];
} {
  // Calculate overall score
  let totalCorrect = 0;

  // Initialize topic performance tracking
  const topicPerformance: Record<
    Topic,
    { correct: number; total: number; percentage: number }
  > = {} as Record<
    Topic,
    { correct: number; total: number; percentage: number }
  >;

  CLOUDINARY_TOPIC_LIST.forEach((topic) => {
    topicPerformance[topic] = { correct: 0, total: 0, percentage: 0 };
  });

  // Analyze each question
  questions.forEach((question) => {
    const userAnswer = userAnswers[question.id];
    const isCorrect = userAnswer === question.correctAnswer;

    if (isCorrect) {
      totalCorrect++;
      topicPerformance[question.topic].correct++;
    }

    topicPerformance[question.topic].total++;
  });

  // Calculate percentages for each topic
  Object.keys(topicPerformance).forEach((topic) => {
    const t = topic as Topic;
    if (topicPerformance[t].total > 0) {
      topicPerformance[t].percentage =
        (topicPerformance[t].correct / topicPerformance[t].total) * 100;
    }
  });

  // Calculate overall percentage
  const overallPercentage = (totalCorrect / questions.length) * 100;

  // Determine improvement areas (topics with < 70% score)
  const improvementAreas = Object.entries(topicPerformance)
    .filter(([_, data]) => data.total > 0 && data.percentage < 70)
    .map(([topic]) => topic as Topic);

  // Determine strengths (topics with >= 90% score)
  const strengths = Object.entries(topicPerformance)
    .filter(([_, data]) => data.total > 0 && data.percentage >= 90)
    .map(([topic]) => topic as Topic);

  return {
    score: {
      correct: totalCorrect,
      total: questions.length,
      percentage: overallPercentage,
    },
    topicPerformance,
    passed: overallPercentage >= 80,
    improvementAreas,
    strengths,
  };
}

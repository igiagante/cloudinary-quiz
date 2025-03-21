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
  console.time("Total Quiz Generation");

  console.time("Topic Selection");
  const selectedTopics =
    topics || generateRandomTopics(Math.min(numQuestions, 5));
  const topicDistribution = createTopicDistribution(
    selectedTopics,
    numQuestions
  );
  console.timeEnd("Topic Selection");

  console.time("Questions Generation");
  const questionPromises = Object.entries(topicDistribution).map(
    ([topic, count]) =>
      generateQuestionsForTopic(topic as Topic, count, difficulty)
  );

  const questionSets = await Promise.all(questionPromises);
  console.timeEnd("Questions Generation");

  console.time("Final Processing");
  const questions = questionSets.flat();
  const shuffledQuestions = shuffleArray(questions);
  console.timeEnd("Final Processing");

  console.timeEnd("Total Quiz Generation");
  return shuffledQuestions;
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
  const startTime = Date.now();

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
    - Vary the position of the correct answer (don't always make it the first option)
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

    console.time(`OpenAI API Call - ${topic}`);
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
    console.timeEnd(`OpenAI API Call - ${topic}`);

    const rawOutput = response.choices[0].message.content;
    if (!rawOutput) throw new Error("No content in response");

    const parsedOutput = JSON.parse(rawOutput);
    const validatedData = questionsArraySchema.parse(parsedOutput);

    const endTime = Date.now();
    console.log(`Time taken for ${topic}: ${endTime - startTime}ms`);
    return validatedData.questions.map((q) => {
      // Shuffle the options and track the new correct answer position
      const optionsWithIndexes = q.options.map((opt, index) => ({
        text: opt,
        isCorrect: index === q.correctAnswerIndex,
      }));
      const shuffledOptions = shuffleArray(optionsWithIndexes);

      return {
        id: uuidv4(),
        question: q.question,
        options: shuffledOptions.map((opt) => opt.text),
        correctAnswer: shuffledOptions.find((opt) => opt.isCorrect)!.text,
        explanation: q.explanation,
        topic: topic,
        difficulty: difficultyLevel,
      };
    });
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

// Optimize the analysis function
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
  console.time("Quiz Analysis");

  // Initialize performance tracking with a single pass through the data
  const topicPerformance = CLOUDINARY_TOPIC_LIST.reduce((acc, topic) => {
    acc[topic] = { correct: 0, total: 0, percentage: 0 };
    return acc;
  }, {} as Record<Topic, { correct: number; total: number; percentage: number }>);

  // Single pass through questions to calculate everything
  const totalCorrect = questions.reduce((correct, question) => {
    const isCorrect = userAnswers[question.id] === question.correctAnswer;
    topicPerformance[question.topic].total++;
    if (isCorrect) {
      topicPerformance[question.topic].correct++;
      return correct + 1;
    }
    return correct;
  }, 0);

  // Calculate percentages in one go
  Object.values(topicPerformance).forEach((topic) => {
    topic.percentage =
      topic.total > 0 ? (topic.correct / topic.total) * 100 : 0;
  });

  const overallPercentage = (totalCorrect / questions.length) * 100;

  // Use filter once for both improvements and strengths
  const [improvementAreas, strengths] = Object.entries(topicPerformance).reduce(
    (acc, [topic, data]) => {
      if (data.total > 0) {
        if (data.percentage < 70) acc[0].push(topic as Topic);
        if (data.percentage >= 90) acc[1].push(topic as Topic);
      }
      return acc;
    },
    [[], []] as [Topic[], Topic[]]
  );

  const result = {
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

  console.timeEnd("Quiz Analysis");
  return result;
}

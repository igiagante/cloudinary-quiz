import { cloudinaryTopics, cloudinaryTopicList } from "@/types/constants";
import { QuizQuestion, Topic } from "@/types";
import { v4 as uuidv4 } from "uuid";
import {
  questionRepository,
  QuestionWithOptions,
} from "@/lib/db/repositories/question.repository";
import Anthropic from "@anthropic-ai/sdk";
import {
  DifficultyLevels,
  QuestionSources,
  ModelTypes,
  ModelType,
  QuestionSource,
} from "@/types/constants";
import { DifficultyLevel } from "@/types/constants";
import { z } from "zod";
import { NextRequest } from "next/server";
import {
  distributeQuestionsByTopic,
  parseTopics,
  parseTopicsMetadata,
  distributeQuestionsByWeight,
} from "./db/parser/topic-parser";

// Progress tracking
type LogLevel = "debug" | "info" | "warn" | "error";
type ProgressCallback = (message: string, level?: LogLevel) => void;
let progressCallback: ProgressCallback | null = null;
let isVerboseLogging = false; // Control detailed logs

export function setProgressCallback(callback: ProgressCallback) {
  progressCallback = callback;
}

export function setVerboseLogging(verbose: boolean) {
  isVerboseLogging = verbose;
}

function reportProgress(message: string, level: LogLevel = "info") {
  if (progressCallback) {
    progressCallback(message, level);
  }

  // Only log to console based on level and verbosity setting
  if (level === "error") {
    console.error(message);
  } else if (level === "warn") {
    console.warn(message);
  } else if (level === "info" || (level === "debug" && isVerboseLogging)) {
    console.log(message);
  }
}

// Helper function to log question processing in a cleaner format
function logQuestionProcessing(
  q: QuestionWithOptions,
  isVerbose: boolean = false
) {
  const questionId = q.uuid;
  const topic = q.topic;
  const optionsCount = q.options?.length || 0;

  if (!isVerbose) {
    // Simple log for normal operation
    return;
  }

  // Detailed logs only when verbose mode is enabled
  reportProgress(
    `Processing question ${questionId.substring(0, 8)}... (${topic})`,
    "debug"
  );

  if (optionsCount < 2) {
    reportProgress(
      `Warning: Question ${questionId.substring(
        0,
        8
      )}... has only ${optionsCount} options`,
      "warn"
    );
  }

  // Log final question state in compact JSON format
  const summary = {
    id: questionId.substring(0, 8) + "...",
    topic,
    optionsCount,
    hasCorrectAnswer: q.options?.some((o) => o.isCorrect) || false,
    hasMultipleCorrectAnswers: q.hasMultipleCorrectAnswers || false,
  };

  reportProgress(`Question summary: ${JSON.stringify(summary)}`, "debug");
}

// Utility function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Format a question with shuffled options
export function formatQuestionWithShuffledOptions(
  q: QuestionWithOptions
): QuizQuestion | null {
  // Try using the regular options array
  let questionOptions =
    q.options && q.options.length > 0
      ? q.options.map((o) => ({
          id: o.id,
          text: o.text,
          isCorrect: o.isCorrect,
        }))
      : null;

  // If options array is empty, try to parse from the jsonb options field
  if (!questionOptions || questionOptions.length === 0) {
    try {
      if (q.options_jsonb) {
        const parsedOptions =
          typeof q.options_jsonb === "string"
            ? JSON.parse(q.options_jsonb)
            : q.options_jsonb;

        if (Array.isArray(parsedOptions) && parsedOptions.length > 0) {
          questionOptions = parsedOptions.map((opt: string, index: number) => ({
            id: index,
            text: opt,
            isCorrect: q.correctAnswer === opt,
          }));
        }
      }
    } catch (e) {
      console.error(
        `Error parsing options for question ${q.uuid.substring(0, 8)}...`
      );
    }
  }

  // Fallback option extraction directly from the question columns
  if (!questionOptions || questionOptions.length === 0) {
    try {
      // Try to extract from the main question JSON fields or text
      const possibleOptions: string[] = [];

      // Check if we can extract options from question text
      // This assumes the format: "Question? A) Option1 B) Option2..."
      const questionText = q.question || "";
      const optionRegex = /\b([A-D])\)\s*([^A-D\n]+)(?=\s*[A-D]\)|$)/g;
      let match;

      while ((match = optionRegex.exec(questionText)) !== null) {
        possibleOptions.push(match[2].trim());
      }

      // If we have options from the regex
      if (possibleOptions.length >= 2) {
        questionOptions = possibleOptions.map((text, idx) => ({
          id: idx,
          text,
          isCorrect: q.correctAnswer === text,
        }));
      }
    } catch (e) {
      console.error(
        `Error extracting options from question text for ${q.uuid}:`,
        e
      );
    }
  }

  // If we still have no options, skip this question
  if (
    !questionOptions ||
    !Array.isArray(questionOptions) ||
    questionOptions.length < 2
  ) {
    console.error(
      `Question ${q.uuid.substring(0, 8)}... has invalid options - skipped`
    );
    return null;
  }

  // Extract options with their correctness info
  const optionsWithCorrectness = questionOptions.map((o) => ({
    text: o.text,
    isCorrect: o.isCorrect,
  }));

  // Check if it's a multiple answer question
  let hasMultipleCorrectAnswers =
    typeof q.hasMultipleCorrectAnswers === "boolean"
      ? q.hasMultipleCorrectAnswers
      : false;

  // Check for multiple correct answers in the question text (this is new)
  if (!hasMultipleCorrectAnswers) {
    const questionText = q.question.toLowerCase();
    const textIndicatesMultipleSelection =
      questionText.includes("select up to") ||
      questionText.includes("select all that apply") ||
      questionText.includes("select two") ||
      questionText.includes("select 2") ||
      (questionText.includes("(select") && questionText.includes(")"));

    // Count correct options
    const correctOptionsCount = optionsWithCorrectness.filter(
      (o) => o.isCorrect
    ).length;

    // Set flag based on text and/or multiple correct options
    if (textIndicatesMultipleSelection || correctOptionsCount > 1) {
      hasMultipleCorrectAnswers = true;
      console.log(
        `Multiple-answer question detected from text: "${q.question.substring(
          0,
          40
        )}..."`
      );
    }
  }

  // Check for multiple correct answers in the explanation field before shuffling
  // This is a fallback for questions that have multiple answers indicated in the explanation
  if (!hasMultipleCorrectAnswers && q.explanation) {
    const explanationText = q.explanation.toLowerCase();

    // Check for different patterns indicating multiple correct answers
    const hasMultipleCorrectPattern =
      explanationText.includes("multiple correct") ||
      explanationText.includes("correct answers") ||
      explanationText.includes("select all") ||
      (explanationText.includes("correct") &&
        /[a-e],\s*[a-e]/i.test(explanationText));

    if (hasMultipleCorrectPattern) {
      // Try to extract letter options (A, B, C, D, E)
      let letterMatches: RegExpMatchArray | null = null;

      // Try different patterns to extract correct answer letters
      const patterns = [
        /correct answers?:?\s*([a-e](?:\s*,\s*[a-e])+)/i, // "correct answers: C, E"
        /correct:?\s*([a-e](?:\s*,\s*[a-e])+)/i, // "correct: C, E"
        /answers?:?\s*([a-e](?:\s*,\s*[a-e])+)/i, // "answers: C, E"
        /options?:?\s*([a-e](?:\s*,\s*[a-e])+)/i, // "options: C, E"
        /([a-e](?:\s*,\s*[a-e])+)/i, // just "C, E" anywhere
      ];

      for (const pattern of patterns) {
        const match = explanationText.match(pattern);
        if (match && match[1]) {
          letterMatches = match[1].match(/[a-e]/gi);
          if (letterMatches && letterMatches.length > 1) {
            break;
          }
        }
      }

      // If we found letter matches
      if (letterMatches && letterMatches.length > 1) {
        hasMultipleCorrectAnswers = true;

        // Map letter indices to actual option texts before shuffling
        const letterToIndex = new Map<string, number>();
        "abcde".split("").forEach((letter, idx) => {
          letterToIndex.set(letter, idx);
        });

        // Get the letter indices
        const letterIndices = letterMatches
          .map((letter) => letterToIndex.get(letter.toLowerCase()) ?? -1)
          .filter((idx) => idx >= 0);

        // Mark options as correct in the original array (before shuffling)
        if (letterIndices.length > 0) {
          // First, reset all isCorrect flags
          optionsWithCorrectness.forEach((opt) => (opt.isCorrect = false));

          // Then mark the specified options as correct
          letterIndices.forEach((idx) => {
            if (idx < optionsWithCorrectness.length) {
              optionsWithCorrectness[idx].isCorrect = true;
            }
          });
        }
      }
    }
  }

  // Shuffle the options
  const shuffledOptions = shuffleArray([...optionsWithCorrectness]);

  // Find correct answers
  const correctOptions = shuffledOptions.filter((o) => o.isCorrect);

  // If there are no correct options but we have a correctAnswer, mark it
  if (correctOptions.length === 0 && q.correctAnswer) {
    const correctIndex = shuffledOptions.findIndex(
      (o) => o.text === q.correctAnswer
    );
    if (correctIndex >= 0) {
      shuffledOptions[correctIndex].isCorrect = true;
      correctOptions.push(shuffledOptions[correctIndex]);
    }
  }

  // Initialize correctAnswers array
  let correctAnswers: string[] = [];

  // For multiple answer questions, get all correct answers from options if needed
  if (
    hasMultipleCorrectAnswers &&
    Array.isArray(q.correctAnswers) &&
    q.correctAnswers.length > 0
  ) {
    // Use provided correctAnswers array if available
    correctAnswers = q.correctAnswers;
  } else if (hasMultipleCorrectAnswers) {
    // Otherwise, use correct options from option array
    correctAnswers = shuffledOptions
      .filter((o) => o.isCorrect)
      .map((o) => o.text);

    // Make sure we have at least two correct answers for multiple-choice questions
    if (correctAnswers.length < 2 && shuffledOptions.length >= 2) {
      // If we don't have at least 2 correct answers but the question text indicates
      // multiple answers, add a second correct option
      console.log(
        `Warning: Question marked as multiple-answer but only has ${correctAnswers.length} correct options`
      );

      // If correctAnswer is set but not in correctAnswers, add it
      if (q.correctAnswer && !correctAnswers.includes(q.correctAnswer)) {
        correctAnswers.push(q.correctAnswer);
      }

      // If we still don't have 2 correct answers, add another option
      if (correctAnswers.length < 2 && shuffledOptions.length >= 2) {
        // Find an option that's not already marked as correct
        const unusedOption = shuffledOptions.find((o) => !o.isCorrect);
        if (unusedOption) {
          unusedOption.isCorrect = true;
          correctAnswers.push(unusedOption.text);
        }
      }
    }
  } else if (correctAnswers.length === 0) {
    // For single-answer questions, just use the correct option
    correctAnswers = correctOptions.map((o) => o.text);
  }

  if (correctOptions.length === 0) {
    console.error(
      `ERROR: Question ${q.uuid} has no correct answer among options`
    );
    // Default to first option as correct
    shuffledOptions[0].isCorrect = true;
    correctOptions.push(shuffledOptions[0]);
  }

  const result: QuizQuestion = {
    id: q.uuid,
    question: q.question,
    options: shuffledOptions.map((o) => o.text),
    correctAnswer:
      correctOptions.length > 0
        ? correctOptions[0].text
        : shuffledOptions[0].text,
    explanation: q.explanation || "",
    topic: q.topic as Topic,
    difficulty: q.difficulty as DifficultyLevel,
    source: (q.source as QuestionSource) || QuestionSources.manual,
    hasMultipleCorrectAnswers,
    correctAnswers: hasMultipleCorrectAnswers ? correctAnswers : [],
  };

  return result;
}

// Get a distribution of topics for the quiz
function createTopicDistribution(
  topics: Topic[],
  totalQuestions: number
): Record<string, number> {
  if (!topics || !Array.isArray(topics) || topics.length === 0) {
    console.error(
      "Invalid topics provided to createTopicDistribution:",
      topics
    );
    return {};
  }

  // Make a safe copy of the topics array to prevent mutations
  const safeTopics = [...topics];
  const distribution: Record<string, number> = {};

  // Log the topics we're distributing
  console.log("Creating distribution for topics:", safeTopics);

  // Initialize with at least one question per topic if possible
  const questionsPerTopic = Math.max(
    1,
    Math.floor(totalQuestions / safeTopics.length)
  );

  safeTopics.forEach((topic) => {
    if (typeof topic === "string") {
      distribution[topic] = questionsPerTopic;
    } else {
      console.warn(`Skipping invalid topic: ${topic}`);
    }
  });

  console.log("Initial distribution:", distribution);

  // Distribute any remaining questions
  let remainingQuestions =
    totalQuestions - questionsPerTopic * safeTopics.length;
  let currentIndex = 0;

  while (remainingQuestions > 0 && safeTopics.length > 0) {
    const topic = safeTopics[currentIndex % safeTopics.length];
    if (typeof topic === "string") {
      distribution[topic]++;
    }
    currentIndex++;
    remainingQuestions--;
  }

  return distribution;
}

// Initialize Anthropic client for Claude 3.7
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Generate questions with Claude 3.7
async function generateQuestionsWithClaude(
  topicDistribution: Record<string, number>,
  difficulty?: DifficultyLevel
): Promise<QuizQuestion[]> {
  const allGeneratedQuestions: QuizQuestion[] = [];

  for (const [topic, count] of Object.entries(topicDistribution)) {
    if (count <= 0) continue;

    reportProgress(
      `Generating ${count} questions for ${topic} using Claude 3.7`
    );

    try {
      const topicDetails = cloudinaryTopics[topic as Topic] || [];
      const difficultyLevel = difficulty || DifficultyLevels.medium;

      // System prompt (similar to the one in quiz-generator-claude.ts but optimized for Claude 3.7)
      const systemPrompt = `
      You are a professional Cloudinary certification exam creator with deep expertise in cloud-based media management, transformation, and delivery. Your task is to create realistic certification exam questions that accurately assess a candidate's practical knowledge of Cloudinary's platform.

      Your questions must have these specific characteristics:
      1) Be indistinguishable from official Cloudinary certification questions
      2) Focus on practical implementation scenarios rather than theoretical concepts
      3) Test decision-making skills in real-world Cloudinary implementation scenarios
      4) Present plausible options that require careful technical discernment
      5) Assess understanding of best practices and optimization strategies
      6) Cover technical details like URL structure, transformation parameters, and API options
      7) Include code examples, transformation strings, or configuration snippets when relevant

      Question format requirements:
      - Each question must have exactly 4 options labeled A, B, C, and D
      - The correct answer must be varied across all questions (don't always make "A" the correct answer)
      - Distractors (wrong answers) must be technically plausible but clearly incorrect upon expert examination
      - Explanation must detail why the correct answer is right AND specifically why each wrong option is incorrect
      - Questions should be direct and concise, but include all necessary context to determine the answer
      - Questions must be at the specified difficulty level: easy (fundamentals), medium (implementation), or hard (edge cases, optimization)

      NEVER include any knowledge checks that are purely definitional or would appear in documentation as simple facts.
      ALWAYS test the application of knowledge in implementation scenarios.
      `;

      // User message
      const userMessage = `
      Generate ${count} high-quality Cloudinary certification quiz questions matching these criteria:

      - Topic: ${topic}
      - Difficulty: ${difficultyLevel}
      - Focus on practical implementation scenarios that test decision-making
      - Include questions that require understanding of technical parameters and options
      - Cover real-world use cases and edge cases that a Cloudinary developer would encounter
      - Test knowledge of best practices and optimization techniques

      ${
        topicDetails.length > 0
          ? `Specifically focus on these subtopics for ${topic}:
      ${topicDetails.map((st) => `- ${st}`).join("\n")}`
          : ""
      }

      Return JSON formatted as:
      {
        "questions": [
          {
            "question": "Full question text with appropriate context and code examples if relevant",
            "options": ["A) Option text", "B) Option text", "C) Option text", "D) Option text"],
            "correctAnswerIndex": 2,
            "explanation": "Detailed explanation of why option C is correct and specifically why options A, B, and D are incorrect",
            "topic": "${topic}",
            "subtopic": "Specific subtopic from the list above",
            "difficulty": "${difficultyLevel}"
          }
        ]
      }
      `;

      // Call Claude 3.7
      reportProgress(`Making Claude 3.7 API call for ${topic}...`);
      const response = await anthropic.messages.create({
        model: "claude-3-sonnet-20240229", // Use the appropriate Claude 3.7 model name
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
        temperature: 0.7,
      });

      // Extract the text content from the response
      let rawOutput = "";
      for (const content of response.content) {
        if (content.type === "text") {
          rawOutput = content.text;
          break;
        }
      }

      if (!rawOutput) throw new Error("No content in Claude response");

      // Parse and validate the response
      let parsedOutput;
      try {
        parsedOutput = JSON.parse(rawOutput);

        // Apply simple validation (can use a schema validator in production)
        if (!parsedOutput.questions || !Array.isArray(parsedOutput.questions)) {
          throw new Error("Invalid response format: missing questions array");
        }
      } catch (parseError) {
        console.error("JSON parse error from Claude:", parseError);
        throw new Error(
          `Failed to parse Claude response: ${rawOutput.substring(0, 100)}...`
        );
      }

      // Convert to QuizQuestion format
      const generatedQuestions = parsedOutput.questions.map((q: any) => {
        // Shuffle the options and track the new correct answer position
        const optionsWithIndexes = q.options.map(
          (opt: string, index: number) => ({
            text: opt,
            isCorrect: index === q.correctAnswerIndex,
          })
        ) as Array<{ text: string; isCorrect: boolean }>;

        const shuffledOptions = shuffleArray(optionsWithIndexes);

        // Find the correct option
        const correctOption = shuffledOptions.find((opt) => opt.isCorrect);
        const correctAnswer = correctOption
          ? correctOption.text
          : shuffledOptions[0].text;

        return {
          id: uuidv4(),
          question: q.question,
          options: shuffledOptions.map((opt) => opt.text),
          correctAnswer,
          explanation: q.explanation,
          topic: topic as Topic,
          difficulty: difficultyLevel as DifficultyLevel,
          source: QuestionSources.claude,
        };
      });

      reportProgress(
        `Successfully generated ${generatedQuestions.length} questions for ${topic}`
      );
      allGeneratedQuestions.push(...generatedQuestions);
    } catch (error) {
      reportProgress(
        `Error generating questions for ${topic} with Claude: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      console.error(`Claude generation error for ${topic}:`, error);
    }
  }

  return allGeneratedQuestions;
}

async function saveQuestionsToDatabase(
  questions: QuizQuestion[]
): Promise<void> {
  for (const question of questions) {
    try {
      // Find the correct answer index
      const correctAnswerIndex = question.options.findIndex(
        (opt) => opt === question.correctAnswer
      );

      if (correctAnswerIndex === -1) {
        console.error("Could not find correct answer in options", question);
        continue;
      }

      // Get question status if it exists, default to 'active'
      const status = (question as any).status || "active";

      // Format for database
      await questionRepository.create({
        id: question.id,
        question: question.question,
        explanation: question.explanation || "",
        topic: question.topic,
        difficulty: question.difficulty || DifficultyLevels.medium,
        options: question.options.map((opt, index) => ({
          text: opt,
          isCorrect: index === correctAnswerIndex,
        })),
        source: question.source as QuestionSource,
        status: status, // Add status field
        qualityScore: (question as any).qualityScore || 0.5, // Default quality score for model-generated questions
      });

      console.log(
        `Saved new question to database: ${question.id} (status: ${status})`
      );
    } catch (error) {
      console.error("Error saving question to database:", error);
    }
  }
}

// Input validation schema
const GenerateSchema = z.object({
  numQuestions: z.number().min(1).max(30).default(10),
  topics: z.array(z.string()).optional(),
  difficulty: z
    .enum([
      DifficultyLevels.easy,
      DifficultyLevels.medium,
      DifficultyLevels.hard,
    ])
    .optional(),
  model: z
    .enum([ModelTypes.openai, ModelTypes.claude, ModelTypes.none])
    .default(ModelTypes.none),
  maxNewQuestions: z.number().min(1).max(10).default(3),
});

export async function POST(request: NextRequest) {
  console.log("POST /api/generate-questions - Starting request");

  try {
    const body = await request.json();
    console.log("Request body:", JSON.stringify(body));

    const parsedBody = GenerateSchema.parse(body);
    const { numQuestions, topics, difficulty, model, maxNewQuestions } =
      parsedBody;

    // Determine which model to use for generation
    const useModel = model === ModelTypes.none ? ModelTypes.none : model;

    // Collection for progress logs
    const progressLogs: string[] = [];

    // Set up progress callback to capture progress
    setProgressCallback((message) => {
      progressLogs.push(message);
      console.log("Progress:", message);
    });

    console.log(
      `Generating quiz with: numQuestions=${numQuestions}, topics=${JSON.stringify(
        topics
      )}, difficulty=${difficulty}, useModel=${useModel}, maxNewQuestions=${maxNewQuestions}`
    );

    try {
      // Generate questions using the fast generator with the updated parameters
      const questions = await generateQuizFast(
        numQuestions,
        topics as Topic[],
        difficulty as DifficultyLevel,
        false,
        useModel as ModelType,
        maxNewQuestions
      );

      console.log(`Generated ${questions.length} questions successfully`);

      if (!questions || !Array.isArray(questions)) {
        console.error("Invalid questions returned:", questions);
        return { error: "Failed to generate valid questions", status: 500 };
      }

      // Return both questions and progress logs
      return { questions, progressLogs };
    } catch (generateError) {
      console.error("Error in generateQuizFast:", generateError);
      throw generateError;
    }
  } catch (error) {
    console.error("Error generating questions:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return {
      error:
        error instanceof Error ? error.message : "Failed to generate questions",
      status: 500,
    };
  }
}

// Main function to generate a quiz using primarily database questions
export async function generateQuizFast(
  numQuestions: number = 10,
  topics?: Topic[] | undefined,
  difficulty?: DifficultyLevel | undefined,
  forceGenerate: boolean = false,
  useModel: ModelType = ModelTypes.none,
  maxNewQuestions: number = 3
): Promise<QuizQuestion[]> {
  reportProgress("Starting quiz generation process...");

  try {
    // Ensure numQuestions is valid
    const questionsToGenerate = Math.max(1, Math.min(30, numQuestions || 10));
    reportProgress(`Will generate ${questionsToGenerate} questions`);

    // 1. Select topics with proper parsing - convert to string array
    const topicsAsStrings =
      topics && Array.isArray(topics)
        ? topics.map((t) => String(t)) // Ensure all topics are strings
        : [];

    // Use parseTopics to ensure consistent handling
    const selectedTopics = parseTopics(topicsAsStrings);

    // Validate we have topics to work with
    if (selectedTopics.length === 0) {
      throw new Error("No topics provided for quiz generation");
    }

    // Log the exact topic strings being used
    reportProgress(`Selected topics: ${selectedTopics.join(", ")}`);
    console.log(
      "Topic strings for database query:",
      JSON.stringify(selectedTopics)
    );

    // 2. Create topic distribution using the improved function
    const topicDistribution = distributeQuestionsByTopic(
      selectedTopics,
      questionsToGenerate
    );

    // 3. Get questions from the database (only active ones)
    let allQuestions: QuizQuestion[] = [];
    let dbQuestionsCount = 0;

    // Always prioritize database questions unless useModel is specified
    reportProgress("Fetching questions from database...");

    // Get questions for each topic - only getting active status questions
    for (const [topic, count] of Object.entries(topicDistribution)) {
      reportProgress(`Fetching up to ${count} questions for ${topic}...`);

      try {
        // Get double the count we need to allow for randomization
        const dbQuestions = await questionRepository.getByTopicAndDifficulty(
          [topic],
          difficulty,
          count * 2,
          "active" // Only get active questions
        );

        console.log(
          `Raw DB query for topic "${topic}" returned ${dbQuestions.length} questions`
        );

        reportProgress(
          `Found ${dbQuestions.length} questions for ${topic} in database`
        );

        // Shuffle and take what we need
        const shuffled = shuffleArray(dbQuestions)
          .slice(0, count)
          .map((q) => formatQuestionWithShuffledOptions(q))
          .filter((q): q is QuizQuestion => q !== null);

        allQuestions = [...allQuestions, ...shuffled];
        dbQuestionsCount += shuffled.length;
      } catch (error) {
        reportProgress(
          `Error fetching questions for ${topic}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        console.error(`Error fetching questions for ${topic}:`, error);
      }
    }

    // 4. Determine if we need to generate new questions with an AI model
    const questionsNeeded = questionsToGenerate - allQuestions.length;
    let newQuestionsToGenerate = Math.min(questionsNeeded, maxNewQuestions);

    // Check if model generation is requested and there's a need for more questions
    const shouldGenerateWithModel =
      questionsNeeded > 0 && useModel !== ModelTypes.none;

    // Generate model-based questions if needed and requested
    let modelGeneratedQuestions: QuizQuestion[] = [];
    if (shouldGenerateWithModel) {
      reportProgress(
        `Generating ${newQuestionsToGenerate} new questions with model: ${useModel}`
      );

      try {
        // Create distribution for remaining questions
        const remainingDistribution = createRemainingDistribution(
          topicDistribution,
          allQuestions,
          newQuestionsToGenerate
        );

        // Generate questions with selected model
        switch (useModel) {
          case ModelTypes.claude:
            modelGeneratedQuestions = await generateQuestionsWithClaude(
              remainingDistribution,
              difficulty
            );
            break;
          case ModelTypes.openai:
            modelGeneratedQuestions = await generateQuestionsWithOpenAI(
              remainingDistribution,
              difficulty
            );
            break;
          default:
            reportProgress("No valid model selected for generation");
        }

        reportProgress(
          `Generated ${modelGeneratedQuestions.length} new questions with model`
        );

        // Save model-generated questions to database with appropriate metadata
        // Mark them for review by default since they're AI-generated
        if (modelGeneratedQuestions.length > 0) {
          reportProgress("Saving model-generated questions to database...");

          // Save with review status
          await saveQuestionsToDatabase(
            modelGeneratedQuestions.map((q) => ({
              ...q,
              status: "review", // Mark as needing review
            }))
          );
        }

        // Add generated questions to our collection
        allQuestions = [...allQuestions, ...modelGeneratedQuestions];
      } catch (error) {
        reportProgress(
          `Error generating questions with model: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        console.error("Model generation error:", error);
      }
    }

    // 5. Use basic fallback questions only if absolutely necessary
    if (allQuestions.length < questionsToGenerate) {
      reportProgress(
        `Warning: Only ${allQuestions.length} questions available out of ${questionsToGenerate} requested. Fallback questions have been disabled.`
      );

      // No fallback questions will be used - just return whatever we have
      // This replaces the previous fallback question generation logic
    }

    // 6. Ensure we have the right number of questions and shuffle them
    const finalQuestions = shuffleArray(allQuestions).slice(
      0,
      questionsToGenerate
    );

    // Log statistics about the sources of questions
    const dbCount = dbQuestionsCount;
    const modelCount = modelGeneratedQuestions.length;
    const fallbackCount = finalQuestions.length - dbCount - modelCount;

    reportProgress(
      `Generated quiz with ${finalQuestions.length} questions (${dbCount} from DB, ${modelCount} from model, ${fallbackCount} fallbacks)`
    );

    if (finalQuestions.length === 0) {
      throw new Error("No questions were generated");
    }

    return finalQuestions;
  } catch (error) {
    reportProgress(
      `Error generating quiz: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    console.error("Quiz generation error:", error);

    // Return fallback questions covering all topics if everything fails
    const safeQuestionsCount = Math.max(1, Math.min(30, numQuestions || 10));
    return generateAllFallbackQuestions(safeQuestionsCount);
  }
}

// New function to generate questions with OpenAI (similar to Claude function)
async function generateQuestionsWithOpenAI(
  topicDistribution: Record<string, number>,
  difficulty?: DifficultyLevel
): Promise<QuizQuestion[]> {
  // Since OpenAI integration isn't implemented yet, we'll use a placeholder
  // that returns an empty array for now. In production, this would call the OpenAI API.
  reportProgress(
    "OpenAI integration not fully implemented yet. Using Claude instead."
  );

  // Fall back to Claude for now (this would be replaced with real OpenAI implementation)
  return generateQuestionsWithClaude(topicDistribution, difficulty);
}

// Generate basic fallback questions when database is empty
function generateFallbackQuestions(
  topic: Topic,
  count: number,
  difficulty?: DifficultyLevel
): QuizQuestion[] {
  // Instead of using templates, return an empty array - we don't want fallback questions
  reportProgress(
    `Skipping fallback question generation for ${topic} as requested`
  );
  return [];
}

// Generate a complete set of fallback questions covering all main topics
function generateAllFallbackQuestions(count: number): QuizQuestion[] {
  reportProgress("Fallback questions have been disabled as requested");
  return [];
}

// Save fallback questions to the database
async function saveFallbackQuestionsToDatabase(
  questions: QuizQuestion[]
): Promise<void> {
  // Since fallback questions are disabled, this is now a no-op
  reportProgress("Fallback question saving disabled");
  return;
}

// Optimize the analysis function
export function analyzeQuizResults(
  questions: QuizQuestion[],
  userAnswers: Record<string, string | string[]>
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
  const topicPerformance = cloudinaryTopicList.reduce((acc, topic) => {
    acc[topic] = { correct: 0, total: 0, percentage: 0 };
    return acc;
  }, {} as Record<Topic, { correct: number; total: number; percentage: number }>);

  // Single pass through questions to calculate everything
  const totalCorrect = questions.reduce((correct, question) => {
    let isCorrect = false;
    const userAnswer = userAnswers[question.id];

    if (question.hasMultipleCorrectAnswers && question.correctAnswers) {
      // For multiple answer questions
      if (Array.isArray(userAnswer) && Array.isArray(question.correctAnswers)) {
        // Check if the arrays have the same length and all correct answers are included
        isCorrect =
          userAnswer.length === question.correctAnswers.length &&
          question.correctAnswers.every((answer) =>
            userAnswer.includes(answer)
          );
      }
    } else {
      // For single answer questions
      isCorrect = userAnswer === question.correctAnswer;
    }

    // Safety check - ensure the topic exists in the performance tracker
    if (!topicPerformance[question.topic]) {
      topicPerformance[question.topic as Topic] = {
        correct: 0,
        total: 0,
        percentage: 0,
      };
      console.warn(`Found question with unrecognized topic: ${question.topic}`);
    }

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

// Create a distribution of remaining questions needed by topic
function createRemainingDistribution(
  originalDistribution: Record<string, number>,
  existingQuestions: QuizQuestion[],
  totalNeeded: number
): Record<string, number> {
  const remaining: Record<string, number> = {};

  // Count existing questions by topic
  const existingCounts: Record<string, number> = {};
  existingQuestions.forEach((q) => {
    existingCounts[q.topic] = (existingCounts[q.topic] || 0) + 1;
  });

  // Calculate remaining needs by topic
  let totalRemaining = 0;
  for (const [topic, originalCount] of Object.entries(originalDistribution)) {
    const existingCount = existingCounts[topic] || 0;
    const remainingCount = Math.max(0, originalCount - existingCount);
    remaining[topic] = remainingCount;
    totalRemaining += remainingCount;
  }

  // If we need to limit the total, proportionally reduce
  if (totalRemaining > totalNeeded) {
    const scaleFactor = totalNeeded / totalRemaining;
    for (const topic in remaining) {
      remaining[topic] = Math.round(remaining[topic] * scaleFactor);
    }

    // Adjust to match exactly the total needed
    let adjustedTotal = Object.values(remaining).reduce(
      (sum, count) => sum + count,
      0
    );
    let diff = totalNeeded - adjustedTotal;

    // Distribute any remaining or excess questions
    const topics = Object.keys(remaining).filter((t) => remaining[t] > 0);
    let i = 0;
    while (diff !== 0 && topics.length > 0) {
      if (diff > 0) {
        remaining[topics[i % topics.length]]++;
        diff--;
      } else if (diff < 0 && remaining[topics[i % topics.length]] > 0) {
        remaining[topics[i % topics.length]]--;
        diff++;
      }
      i++;
    }
  }

  return remaining;
}

/**
 * Select questions for the quiz with topic-based distribution
 */
function selectQuestions(
  allQuestions: QuizQuestion[],
  count: number
): QuizQuestion[] {
  // Get topic distribution
  const distribution = distributeQuestionsByWeight(count);
  const topics = parseTopicsMetadata();
  const selectedQuestions: QuizQuestion[] = [];

  // Keep track of how many questions we've selected per topic
  const selectedByTopic: Record<number, number> = {};
  topics.forEach((topic) => (selectedByTopic[topic.id] = 0));

  // Group questions by topic
  const questionsByTopic: Record<string | number, QuizQuestion[]> = {};
  topics.forEach((topic) => (questionsByTopic[topic.id] = []));

  allQuestions.forEach((question) => {
    if (question.topic) {
      if (!questionsByTopic[question.topic as string | number]) {
        questionsByTopic[question.topic as string | number] = [];
      }
      questionsByTopic[question.topic as string | number].push(question);
    }
  });

  // First pass - ensure minimum distribution by picking random questions from each topic
  topics.forEach((topic) => {
    const topicQuestions = questionsByTopic[topic.id] || [];
    const topicTarget = distribution[topic.id] || 0;

    // Shuffle topic questions for randomness
    const shuffled = [...topicQuestions].sort(() => 0.5 - Math.random());

    // Take up to our distribution target
    const toSelect = Math.min(topicTarget, shuffled.length);
    for (let i = 0; i < toSelect; i++) {
      selectedQuestions.push(shuffled[i]);
      selectedByTopic[topic.id]++;
    }
  });

  // Second pass - if we didn't get enough questions, fill in from any topic
  const remainingCount = count - selectedQuestions.length;
  if (remainingCount > 0) {
    const remainingQuestions = allQuestions.filter(
      (q) => !selectedQuestions.some((sq) => sq.id === q.id)
    );

    const shuffledRemaining = [...remainingQuestions].sort(
      () => 0.5 - Math.random()
    );
    for (
      let i = 0;
      i < Math.min(remainingCount, shuffledRemaining.length);
      i++
    ) {
      selectedQuestions.push(shuffledRemaining[i]);
    }
  }

  return selectedQuestions;
}

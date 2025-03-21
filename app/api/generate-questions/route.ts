import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { questionRepository } from "@/lib/db/repositories/question.repository";
import { CLOUDINARY_TOPIC_LIST } from "@/lib/cloudinary-topics";
import { generateQuizQuestions } from "@/lib/quiz-generator";
import { Topic } from "@/types";

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

// Input validation schema
const generateQuestionsSchema = z.object({
  numQuestions: z.number().min(1).max(30).default(10),
  topics: z.array(z.string()).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { numQuestions, topics, difficulty } =
      generateQuestionsSchema.parse(body);

    // First, try to find existing questions in the database
    const selectedTopics = topics || [];
    let dbQuestions = [];

    if (selectedTopics.length > 0) {
      // Get questions matching the specified topics and difficulty
      dbQuestions = await questionRepository.getByTopicAndDifficulty(
        selectedTopics,
        difficulty,
        numQuestions
      );
    } else {
      // Get random questions
      const allTopics = CLOUDINARY_TOPIC_LIST;
      dbQuestions = await questionRepository.getByTopicAndDifficulty(
        allTopics,
        difficulty,
        numQuestions
      );
    }

    // If we have enough questions from the database, return them
    if (dbQuestions.length >= numQuestions) {
      const formattedQuestions = dbQuestions
        .slice(0, numQuestions)
        .map((q) => ({
          id: q.uuid,
          question: q.question,
          options: q.options.map((o) => o.text),
          correctAnswer: q.options.find((o) => o.isCorrect)?.text || "",
          explanation: q.explanation,
          topic: q.topic,
          difficulty: q.difficulty,
        }));

      return NextResponse.json({ questions: formattedQuestions });
    }

    // If we don't have enough questions, generate more
    const questionsToGenerate = numQuestions - dbQuestions.length;
    console.log(`Generating ${questionsToGenerate} new questions`);

    const generatedQuestions = await generateQuizQuestions(
      questionsToGenerate,
      selectedTopics.length > 0
        ? (selectedTopics as Topic[])
        : CLOUDINARY_TOPIC_LIST,
      difficulty
    );

    // Save the generated questions to the database
    for (const question of generatedQuestions) {
      try {
        const correctAnswerIndex = question.options.findIndex(
          (opt) => opt === question.correctAnswer
        );

        if (correctAnswerIndex === -1) {
          console.error("Could not find correct answer in options", question);
          continue;
        }

        await questionRepository.create({
          question: question.question,
          explanation: question.explanation,
          topic: question.topic,
          difficulty: question.difficulty || "medium",
          options: question.options.map((opt, index) => ({
            text: opt,
            isCorrect: index === correctAnswerIndex,
          })),
        });
      } catch (error) {
        console.error("Error saving question to database:", error);
      }
    }

    // Combine database questions with newly generated ones
    const allQuestions = [
      ...dbQuestions.map((q) => ({
        id: q.uuid,
        question: q.question,
        options: q.options.map((o) => o.text),
        correctAnswer: q.options.find((o) => o.isCorrect)?.text || "",
        explanation: q.explanation,
        topic: q.topic,
        difficulty: q.difficulty,
      })),
      ...generatedQuestions,
    ].slice(0, numQuestions);

    return NextResponse.json({ questions: allQuestions });
  } catch (error) {
    console.error("Error generating questions:", error);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get("topic");
    const difficulty = searchParams.get("difficulty");
    const limit = parseInt(searchParams.get("limit") || "10");

    let questions;

    if (topic) {
      questions = await questionRepository.getByTopicAndDifficulty(
        [topic],
        difficulty || undefined,
        limit
      );
    } else {
      questions = await questionRepository.getAll();
      questions = questions.slice(0, limit);
    }

    const formattedQuestions = questions.map((q) => ({
      id: q.uuid,
      question: q.question,
      options: q.options.map((o) => o.text),
      correctAnswer: q.options.find((o) => o.isCorrect)?.text || "",
      explanation: q.explanation,
      topic: q.topic,
      difficulty: q.difficulty,
    }));

    return NextResponse.json({ questions: formattedQuestions });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

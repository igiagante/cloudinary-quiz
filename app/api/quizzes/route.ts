// app/api/quizzes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { quizRepository } from "@/lib/db/repositories/quiz.repository";
import { questionRepository } from "@/lib/db/repositories/question.repository";
import { getTestUserId } from "@/lib/utils";
import { db } from "@/lib/db";
import { closeConnection } from "@/lib/db";

// Input validation schema for creating a quiz
const createQuizSchema = z.object({
  userId: z.string().optional(),
  numQuestions: z.number().min(1).max(30).default(10),
  topics: z.array(z.string()).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  questionIds: z.array(z.string()).optional(), // New: allow passing specific question IDs
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, numQuestions, topics, difficulty } =
      createQuizSchema.parse(body);
    let { questionIds } = createQuizSchema.parse(body);

    // Use the test user ID
    const testUserId = getTestUserId();

    // No need to convert userId to number - use it as a string
    if (!userId) {
      console.error("Quiz creation failed: No user ID provided");
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    console.log(
      `Creating quiz for user: ${userId} with ${numQuestions} questions`
    );

    // Add debugging
    console.log("Received question IDs:", questionIds);

    // Before creating the quiz, convert the UUIDs to valid question IDs
    if (questionIds && questionIds.length > 0) {
      try {
        // We need to find the actual questions by their IDs
        // This is a workaround until the generate-questions API is fixed

        // Use the question repository to look up questions by whatever ID we have
        let validQuestions = await Promise.all(
          questionIds.map(async (id) => {
            // Try to find by either id or uuid depending on what's available
            const question = await questionRepository.findByIdOrUuid(id);
            return question;
          })
        );

        // Filter out any null or undefined results and get the actual question IDs
        validQuestions = validQuestions.filter(
          (q) => q !== null && q !== undefined
        );

        // Add a safety check when accessing the id property
        let validQuestionIds = validQuestions
          .map((q) => q?.id)
          .filter((id): id is number => id !== undefined && id !== null);

        console.log(
          `Found ${validQuestionIds.length} valid questions out of ${questionIds.length} IDs`
        );

        if (validQuestionIds.length === 0) {
          // Instead of doing multiple database queries, fetch available questions once
          const availableQuestions = await db.query.questions.findMany({
            limit: 20, // Get a reasonable number of questions
          });

          if (availableQuestions.length === 0) {
            console.error("No questions available in the database");
            return NextResponse.json(
              { error: "No questions available in the database" },
              { status: 500 }
            );
          }

          console.log(
            "Using available questions from database instead of provided IDs"
          );

          // Take up to numQuestions random questions from available questions
          const selectedQuestions = availableQuestions
            .sort(() => 0.5 - Math.random())
            .slice(0, numQuestions || 10);

          questionIds = selectedQuestions.map((q) => q.id.toString());
          validQuestions = selectedQuestions;
          validQuestionIds = selectedQuestions.map((q) => q.id);

          console.log("Selected question IDs:", validQuestionIds);
        }

        // Create quiz with valid question IDs
        const quiz = await quizRepository.create({
          userId: testUserId,
          numQuestions: validQuestionIds.length,
          questionIds: validQuestionIds.map((id) => id.toString()),
        });

        return NextResponse.json({ quizId: quiz.id });
      } catch (error) {
        console.error("Error creating quiz with provided question IDs:", error);
        return NextResponse.json(
          { error: "Failed to create quiz with provided question IDs" },
          { status: 500 }
        );
      } finally {
        // Close connection after request is done
        await closeConnection();
      }
    }

    // Otherwise, get questions from the database based on topics
    try {
      let questions;
      if (topics && topics.length > 0) {
        // Use the exact topics provided in the request
        console.log("Using topics from request:", topics);
        questions = await questionRepository.getByTopicAndDifficulty(
          topics,
          difficulty,
          numQuestions
        );
      } else {
        // If no topics provided, use all topics
        console.log("No topics provided, using all topics");
        const allTopics = await questionRepository.getAllTopics();
        questions = await questionRepository.getByTopicAndDifficulty(
          allTopics,
          difficulty,
          numQuestions
        );
      }

      // If we don't have enough questions, return an error
      if (questions.length < numQuestions) {
        return NextResponse.json(
          {
            error: `Not enough questions available. Requested ${numQuestions}, found ${questions.length}`,
          },
          { status: 400 }
        );
      }

      // Create a new quiz with the selected questions
      const selectedQuestionIds = questions.map((q) => q.id.toString());
      const quiz = await quizRepository.create({
        userId: testUserId,
        numQuestions,
        questionIds: selectedQuestionIds,
      });

      return NextResponse.json({ quizId: quiz.id });
    } finally {
      // Close connection after request is done
      await closeConnection();
    }
  } catch (error) {
    console.error("Error creating quiz:", error);
    try {
      await closeConnection();
    } catch (cleanupError) {
      console.error("Error during connection cleanup:", cleanupError);
    }
    return NextResponse.json(
      { error: "Failed to create quiz" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const quizId = url.searchParams.get("id");
    const userId = url.searchParams.get("userId");

    if (quizId) {
      // Get a specific quiz
      const quiz = await quizRepository.getById(quizId);
      if (!quiz) {
        return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
      }
      return NextResponse.json(quiz);
    } else if (userId) {
      // Get quizzes for a user
      const quizHistory = await quizRepository.getQuizHistory(userId);
      return NextResponse.json({ quizHistory });
    } else {
      return NextResponse.json(
        { error: "Missing id or userId parameter" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quizzes" },
      { status: 500 }
    );
  } finally {
    // Close connection after request is done
    await closeConnection();
  }
}

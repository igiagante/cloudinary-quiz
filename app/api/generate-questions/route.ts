import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GenerateQuestionsService } from "@/lib/services/generate-questions.service";
import { debug } from "@/lib/debug";

export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();

    // Use the service to validate and generate questions
    const questionsService = new GenerateQuestionsService();
    const validatedInput = questionsService.validateInput(body);

    // Check if topics exists and has elements
    if (!validatedInput.topics || validatedInput.topics.length === 0) {
      return NextResponse.json(
        { error: "At least one topic is required" },
        { status: 400 }
      );
    }

    debug.log(`Generate questions request: ${JSON.stringify(validatedInput)}`);

    // Get questions from the service
    const generatedQuestions = await questionsService.generateQuestions({
      numQuestions: validatedInput.numQuestions,
      topics: validatedInput.topics,
      difficulty: validatedInput.difficulty,
      model: validatedInput.model,
      maxNewQuestions: validatedInput.maxNewQuestions,
      verboseLogging: validatedInput.verboseLogging,
    });

    if (generatedQuestions.length === 0) {
      return NextResponse.json(
        { error: "Could not generate questions" },
        { status: 404 }
      );
    }

    return NextResponse.json({ questions: generatedQuestions });
  } catch (error) {
    debug.error("Error in generate-questions:", error);

    // Handle validation errors specifically
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input format", details: error.format() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate questions",
      },
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
    const status = searchParams.get("status") || "active"; // Default to active questions
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    debug.log(
      `Get questions request with params: topic=${topic}, difficulty=${difficulty}, limit=${limit}, status=${status}`
    );

    // Use the service to retrieve questions
    const questionsService = new GenerateQuestionsService();
    const questions = await questionsService.getQuestions({
      topic: topic || undefined,
      difficulty: difficulty || undefined,
      limit,
      status,
      includeDeleted,
    });

    return NextResponse.json({ questions });
  } catch (error) {
    debug.error("Error fetching questions:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch questions",
      },
      { status: 500 }
    );
  }
}

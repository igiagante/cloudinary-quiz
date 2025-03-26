import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import {
  Topics,
  Difficulties,
} from "@/lib/db/repositories/question.repository";
import { QuestionInput } from "@/lib/db/repositories/question.repository";

// Initialize OpenAI client for image analysis
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const images = formData.getAll("images") as File[];

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 }
      );
    }

    // Process each image and extract questions
    const extractedQuestions: QuestionInput[] = [];

    for (const image of images) {
      try {
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString("base64");

        // Use OpenAI Vision model to extract text and identify question structure
        const response = await openai.chat.completions.create({
          model: "gpt-4-vision-preview",
          messages: [
            {
              role: "system",
              content:
                "You are an assistant that analyzes images of quiz questions and extracts structured data. Identify the question text, options (A, B, C, D), correct answer (if marked), and any explanation text. Return the data in JSON format.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract the quiz question from this image. Return a JSON object with the question text, options array, correctAnswerIndex (0-3), explanation (if available), and guess the appropriate Cloudinary topic and difficulty. Format the response as valid JSON only.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${image.type};base64,${base64}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 1500,
          response_format: { type: "json_object" },
        });

        const extractedData = JSON.parse(response.choices[0].message.content!);

        // Validate topic and difficulty
        const topic = Object.values(Topics).includes(extractedData.topic)
          ? extractedData.topic
          : Topics[0];

        const difficulty = Object.values(Difficulties).includes(
          extractedData.difficulty
        )
          ? extractedData.difficulty
          : "medium";

        // Convert the options to our expected format
        const options = extractedData.options.map(
          (option: string, index: number) => ({
            text: option,
            isCorrect: index === extractedData.correctAnswerIndex,
          })
        );

        extractedQuestions.push({
          question: extractedData.question,
          explanation: extractedData.explanation || "No explanation available",
          topic,
          difficulty,
          options,
          source: "manual",
        });
      } catch (imageError) {
        console.error("Error processing image:", imageError);
        // Continue with other images even if one fails
      }
    }

    return NextResponse.json({ questions: extractedQuestions });
  } catch (error) {
    console.error("Error extracting questions from images:", error);
    return NextResponse.json(
      { error: "Failed to process images" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    { message: "Use POST to upload images for question extraction" },
    { status: 405 }
  );
}

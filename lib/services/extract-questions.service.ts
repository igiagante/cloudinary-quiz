import { OpenAI } from "openai";
import { debug } from "@/lib/debug";
import {
  Topics,
  Difficulties,
  QuestionInput,
} from "@/lib/db/repositories/question.repository";

// Initialize OpenAI client for image analysis
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Service for extracting quiz questions from images
 */
export class ExtractQuestionsService {
  /**
   * Extract questions from a list of image files
   */
  async extractQuestionsFromImages(images: File[]): Promise<QuestionInput[]> {
    debug.log(`Extracting questions from ${images.length} images`);

    if (!images || images.length === 0) {
      throw new Error("No images provided");
    }

    // Process each image and extract questions
    const extractedQuestions: QuestionInput[] = [];

    for (const image of images) {
      try {
        debug.log(`Processing image: ${image.name}`);
        const extractedQuestion = await this.processImage(image);
        extractedQuestions.push(extractedQuestion);
      } catch (imageError) {
        debug.error(`Error processing image ${image.name}:`, imageError);
        // Continue with the next image rather than failing the entire operation
      }
    }

    debug.log(
      `Successfully extracted ${extractedQuestions.length} questions from images`
    );
    return extractedQuestions;
  }

  /**
   * Process a single image to extract a question
   */
  private async processImage(image: File): Promise<QuestionInput> {
    // Convert image to base64
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

    // Parse the extracted data
    const extractedData = JSON.parse(response.choices[0].message.content!);

    // Validate topic and difficulty and use defaults if invalid
    const topic = Object.values(Topics).includes(extractedData.topic as any)
      ? extractedData.topic
      : Topics[0];

    const difficulty = Object.values(Difficulties).includes(
      extractedData.difficulty as any
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

    return {
      question: extractedData.question,
      explanation: extractedData.explanation || "No explanation available",
      topic,
      difficulty,
      options,
      source: "manual",
    };
  }
}

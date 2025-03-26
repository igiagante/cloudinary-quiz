import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { questions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Input validation schema
const feedbackSchema = z.object({
  questionId: z.string(),
  isHelpful: z.boolean(),
  userId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, isHelpful } = feedbackSchema.parse(body);

    // Find the question in the database
    const question = await db.query.questions.findFirst({
      where: eq(questions.uuid, questionId),
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Update the feedback metrics
    const feedbackCount = question.feedbackCount + 1;
    const positiveRatings = isHelpful
      ? question.positiveRatings + 1
      : question.positiveRatings;

    // Calculate the new quality score (percentage of positive ratings)
    const qualityScore = Math.round((positiveRatings / feedbackCount) * 100);

    // Update the question in the database
    await db
      .update(questions)
      .set({
        feedbackCount,
        positiveRatings,
        qualityScore,
        updatedAt: new Date(),
      })
      .where(eq(questions.uuid, questionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing feedback:", error);
    return NextResponse.json(
      { error: "Failed to process feedback" },
      { status: 500 }
    );
  }
}

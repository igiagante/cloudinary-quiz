import { NextResponse } from "next/server";
import { debug } from "@/lib/debug";
import { QuizReviewService } from "@/lib/services/quiz-review.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const { quizId } = await params;

    debug.log(`Review request for quizId: ${quizId}, userId: ${userId}`);

    if (!quizId || !userId) {
      return NextResponse.json(
        { error: "Missing quizId or userId" },
        { status: 400 }
      );
    }

    // Use the QuizReviewService to get formatted review data
    const reviewService = new QuizReviewService();
    const reviewData = await reviewService.getQuizReviewData(quizId, userId);

    debug.log(
      `Successfully generated review for quiz ${quizId} with ${reviewData.questions.length} questions`
    );
    return NextResponse.json(reviewData);
  } catch (error) {
    debug.error("Error fetching quiz review data:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch quiz review data",
      },
      { status: 500 }
    );
  }
}

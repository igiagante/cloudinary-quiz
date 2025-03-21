import { NextRequest, NextResponse } from "next/server";
import { Topic, QuizQuestion } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { questions, userAnswers } = await request.json();

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

    // Initialize all topics with zero counts
    questions.forEach((question: QuizQuestion) => {
      if (!topicPerformance[question.topic]) {
        topicPerformance[question.topic] = {
          correct: 0,
          total: 0,
          percentage: 0,
        };
      }
    });

    // Analyze each question
    questions.forEach((question: QuizQuestion) => {
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

    // Determine strengths (topics with >= 80% score)
    const strengths = Object.entries(topicPerformance)
      .filter(([_, data]) => data.total > 0 && data.percentage >= 80)
      .map(([topic]) => topic as Topic);

    return NextResponse.json({
      score: {
        correct: totalCorrect,
        total: questions.length,
        percentage: overallPercentage,
      },
      topicPerformance,
      passed: overallPercentage >= 80,
      improvementAreas,
      strengths,
    });
  } catch (error) {
    console.error("Error analyzing results:", error);
    return NextResponse.json(
      { error: "Failed to analyze results" },
      { status: 500 }
    );
  }
}

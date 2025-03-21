// app/results/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ResultsSummary from "@/components/results-summary";
import { QuizQuestion, QuizResults, TopicPerformance } from "@/types";
import AdminLink from "@/components/admin-link";
import { analyzeQuizResults } from "@/lib/quiz-generator";

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<QuizResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wrongQuestions, setWrongQuestions] = useState<QuizQuestion[]>([]);

  useEffect(() => {
    const generateResults = async () => {
      try {
        // Get quiz state from localStorage
        const quizStateStr = localStorage.getItem("quizState");
        if (!quizStateStr) {
          throw new Error("No quiz data found");
        }

        const quizState = JSON.parse(quizStateStr);

        // Check if all questions are answered
        const allQuestions = quizState.questions;
        const userAnswers = quizState.userAnswers;

        const unansweredQuestions = allQuestions.filter(
          (q: QuizQuestion) => !userAnswers[q.id]
        );

        if (unansweredQuestions.length > 0) {
          throw new Error(
            `${unansweredQuestions.length} questions are unanswered`
          );
        }

        // Generate results
        const analysisResults = analyzeQuizResults(allQuestions, userAnswers);

        // Format results for UI
        const topicBreakdown: TopicPerformance[] = Object.entries(
          analysisResults.topicPerformance
        )
          .filter(([_, data]) => data.total > 0)
          .map(([topic, data]) => ({
            topic: topic as any,
            correct: data.correct,
            total: data.total,
            percentage: data.percentage,
          }))
          .sort((a, b) => b.percentage - a.percentage); // Sort by percentage descending

        const formattedResults: QuizResults = {
          score: analysisResults.score,
          passed: analysisResults.passed,
          topicBreakdown,
          improvementAreas: analysisResults.improvementAreas,
          strengths: analysisResults.strengths,
        };

        setResults(formattedResults);

        // Find incorrect questions for the review section
        const incorrectQuestions = allQuestions.filter(
          (q: QuizQuestion) => userAnswers[q.id] !== q.correctAnswer
        );

        setWrongQuestions(incorrectQuestions);
      } catch (err) {
        console.error("Error generating results:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    };

    generateResults();
  }, []);

  const handleRetakeQuiz = () => {
    // Clear quiz state
    localStorage.removeItem("quizState");

    // Navigate back to home
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-700 mb-2">
            No Results Available
          </h2>
          <p className="text-yellow-600">We couldn't find your quiz results.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
          >
            Start a New Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <ResultsSummary results={results} onRetake={handleRetakeQuiz} />
      </div>

      {wrongQuestions.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl mx-auto mb-8">
          <div className="flex items-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-red-500 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-xl font-bold">Questions to Review</h3>
          </div>

          <div className="space-y-6">
            {wrongQuestions.map((question, index) => {
              const quizStateStr = localStorage.getItem("quizState");
              const userAnswers = quizStateStr
                ? JSON.parse(quizStateStr).userAnswers
                : {};
              const userAnswer = userAnswers[question.id];

              return (
                <div
                  key={question.id}
                  className="border p-4 rounded-lg bg-gray-50"
                >
                  <h4 className="font-semibold mb-2">
                    {index + 1}. {question.question}
                  </h4>

                  <div className="mb-3">
                    <p className="text-red-600 font-medium text-sm">
                      Your answer: {userAnswer}
                    </p>
                    <p className="text-green-600 font-medium text-sm">
                      Correct answer: {question.correctAnswer}
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Explanation:</span>{" "}
                      {question.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AdminLink />
    </div>
  );
}

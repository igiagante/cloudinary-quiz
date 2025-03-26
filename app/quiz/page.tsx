// app/quiz/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QuizCard from "@/components/quiz-card";
import QuizProgress from "@/components/quiz-progress";
import { QuizState } from "@/types";

export default function QuizPage() {
  const router = useRouter();
  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    currentQuestionIndex: 0,
    userAnswers: {},
    isComplete: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizSettings, setQuizSettings] = useState<{
    model?: "openai" | "claude";
    topics?: string[];
  }>({});

  const currentQuestion = quizState.questions[quizState.currentQuestionIndex];

  useEffect(() => {
    try {
      // Get quiz settings from localStorage if available
      const settingsStr = localStorage.getItem("quizSettings");
      if (settingsStr) {
        try {
          const settings = JSON.parse(settingsStr);
          setQuizSettings(settings);
        } catch (e) {
          console.error("Failed to parse quiz settings", e);
        }
      }

      // Get existing quiz state from localStorage
      const quizStateStr = localStorage.getItem("quizState");
      if (!quizStateStr) {
        throw new Error("No quiz state found");
      }

      const savedQuizState = JSON.parse(quizStateStr);
      setQuizState(savedQuizState);
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading quiz state:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      setIsLoading(false);
    }
  }, []);

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    setQuizState((prev) => ({
      ...prev,
      userAnswers: {
        ...prev.userAnswers,
        [questionId]: answer,
      },
    }));
  };

  const handleFeedback = async (questionId: string, isHelpful: boolean) => {
    try {
      const userId = localStorage.getItem("userId");

      await fetch("/api/question-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId,
          isHelpful,
          userId,
        }),
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  const handleNext = () => {
    if (quizState.currentQuestionIndex === quizState.questions.length - 1) {
      setQuizState((prev) => ({
        ...prev,
        isComplete: true,
      }));

      // Save quiz state to localStorage
      localStorage.setItem("quizState", JSON.stringify(quizState));

      // Navigate to results page
      router.push("/results");
    } else {
      setQuizState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }));
    }
  };

  const handlePrevious = () => {
    if (quizState.currentQuestionIndex > 0) {
      setQuizState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
      }));
    }
  };

  const toggleReviewMode = () => {
    setIsReviewMode(!isReviewMode);
  };

  const allQuestionsAnswered = quizState.questions.every(
    (q) => quizState.userAnswers[q.id]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-6 bg-white shadow-lg rounded-lg max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Generating your quiz questions...
          </h2>
          <p className="text-gray-600 mb-4">
            This may take a moment as we create high-quality questions tailored
            to your selected topics.
          </p>

          {quizSettings.model && (
            <div className="text-sm font-medium bg-blue-50 text-blue-700 p-2 rounded-md mb-3">
              Using{" "}
              {quizSettings.model === "claude" ? "Claude AI" : "OpenAI GPT-4"}{" "}
              for question generation
            </div>
          )}

          <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded-md">
            <p>
              Quiz questions are being generated based on your selected
              preferences. New questions will be saved to our database for
              future use.
            </p>
            <p className="mt-2 text-xs">
              Note: AI generation may occasionally fail due to service limits.
              The system will automatically retry or switch models if needed.
            </p>
          </div>
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

  if (isReviewMode) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Review All Questions</h1>
          <button
            onClick={toggleReviewMode}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Quiz
          </button>
        </div>

        {quizState.questions.map((question, index) => (
          <div key={question.id} className="mb-8">
            <div className="text-sm text-gray-500 mb-1">
              Question {index + 1}
            </div>
            <QuizCard
              question={question}
              onAnswer={handleAnswer}
              showExplanation={!!quizState.userAnswers[question.id]}
              userAnswer={quizState.userAnswers[question.id]}
              onFeedback={handleFeedback}
            />
          </div>
        ))}

        <div className="flex justify-between mt-6">
          <button
            onClick={toggleReviewMode}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded"
          >
            Back to Quiz
          </button>

          {allQuestionsAnswered && (
            <button
              onClick={() => {
                localStorage.setItem(
                  "quizState",
                  JSON.stringify({
                    ...quizState,
                    isComplete: true,
                  })
                );
                router.push("/results");
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded"
            >
              View Results
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <QuizProgress
        currentQuestion={quizState.currentQuestionIndex + 1}
        totalQuestions={quizState.questions.length}
        onReview={toggleReviewMode}
      />

      {currentQuestion && (
        <QuizCard
          question={currentQuestion}
          onAnswer={handleAnswer}
          showExplanation={!!quizState.userAnswers[currentQuestion.id]}
          userAnswer={quizState.userAnswers[currentQuestion.id]}
          onFeedback={handleFeedback}
        />
      )}

      <div className="flex justify-between mt-6">
        <button
          onClick={handlePrevious}
          disabled={quizState.currentQuestionIndex === 0}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded disabled:opacity-50"
        >
          Previous
        </button>

        <button
          onClick={handleNext}
          disabled={!quizState.userAnswers[currentQuestion?.id]}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded disabled:opacity-50"
        >
          {quizState.currentQuestionIndex === quizState.questions.length - 1
            ? "Finish Quiz"
            : "Next Question"}
        </button>
      </div>
    </div>
  );
}

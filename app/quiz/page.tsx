// app/quiz/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QuizCard from "@/components/quiz-card";
import QuizProgress from "@/components/quiz-progress";
import { QuizQuestion, QuizState } from "@/types";

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

  const currentQuestion = quizState.questions[quizState.currentQuestionIndex];

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        // Get quiz configuration from localStorage
        const configStr = localStorage.getItem("quizConfig");
        if (!configStr) {
          throw new Error("No quiz configuration found");
        }

        const config = JSON.parse(configStr);

        // Fetch questions from API
        const response = await fetch("/api/generate-questions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(config),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch questions");
        }

        const data = await response.json();

        setQuizState({
          questions: data.questions,
          currentQuestionIndex: 0,
          userAnswers: {},
          isComplete: false,
        });
      } catch (err) {
        console.error("Error fetching questions:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleAnswer = (questionId: string, answer: string) => {
    setQuizState((prev) => ({
      ...prev,
      userAnswers: {
        ...prev.userAnswers,
        [questionId]: answer,
      },
    }));
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating your quiz questions...</p>
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

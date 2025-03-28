"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Types for the review page
interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string | string[];
  explanation: string;
  topic: string;
  userAnswer?: string | string[];
  isCorrect?: boolean;
}

interface QuizReviewState {
  questions: QuizQuestion[];
  quizId: string;
  userId: string;
  completedAt: string;
}

export default function ReviewQuestionsPage() {
  const router = useRouter();
  const [reviewState, setReviewState] = useState<QuizReviewState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load quiz data for review
    const loadQuizForReview = async () => {
      try {
        // Check for demo mode
        const isDemo =
          new URLSearchParams(window.location.search).get("demo") === "true";

        // Get quiz ID and user ID with better error handling
        let quizId = localStorage.getItem("quizId");
        let userId = localStorage.getItem("userId");

        console.log("Review page attempting to load with:", {
          quizId,
          userId,
          isDemo,
        });

        if (isDemo) {
          // Use demo data
          console.log("Using demo data for review page");
          setReviewState({
            quizId: "demo-quiz-id",
            userId: "demo-user-id",
            completedAt: new Date().toISOString(),
            questions: [
              {
                id: "q1",
                question:
                  "Which of the following is NOT a valid transformation parameter in Cloudinary?",
                options: ["w_300,h_200", "c_fill", "e_sepia", "t_optimize"],
                correctAnswer: "t_optimize",
                explanation:
                  "While w_300,h_200 (width and height), c_fill (crop mode), and e_sepia (effect) are valid transformation parameters, t_optimize is not a standard Cloudinary parameter.",
                topic: "Transformations & Manipulation",
                userAnswer: "t_optimize",
                isCorrect: true,
              },
              {
                id: "q2",
                question:
                  "Which Cloudinary feature allows you to automatically detect and crop around faces?",
                options: ["c_face", "g_face", "f_detect", "r_max"],
                correctAnswer: "g_face",
                explanation:
                  "g_face is the gravity parameter that tells Cloudinary to focus on faces when cropping images. This is often used in combination with c_crop or c_fill to create intelligent crops that preserve faces.",
                topic: "Transformations & Manipulation",
                userAnswer: "c_face",
                isCorrect: false,
              },
              {
                id: "q3",
                question:
                  "What is the correct way to apply multiple transformations in sequence in a Cloudinary URL?",
                options: [
                  "Use a comma between transformations: w_300,h_200,c_fill",
                  "Use a pipe symbol between transformations: w_300|h_200|c_fill",
                  "Use a forward slash between transformation groups: w_300,h_200/c_fill/e_sepia",
                  "Use an ampersand between transformations: w_300&h_200&c_fill",
                ],
                correctAnswer:
                  "Use a forward slash between transformation groups: w_300,h_200/c_fill/e_sepia",
                explanation:
                  "In Cloudinary, transformations are grouped using commas, and transformation groups are separated by forward slashes. This allows for sequential transformations to be applied in order.",
                topic: "Transformations & Manipulation",
                userAnswer:
                  "Use a forward slash between transformation groups: w_300,h_200/c_fill/e_sepia",
                isCorrect: true,
              },
            ],
          });
          setLoading(false);
          return;
        }

        if (!quizId || !userId) {
          console.error("Missing quiz ID or user ID for review:", {
            quizId,
            userId,
          });
          // Dump all localStorage for debugging
          const allStorage: Record<string, string | null> = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
              allStorage[key] = localStorage.getItem(key);
            }
          }
          console.log("All localStorage items:", allStorage);
          throw new Error(
            "Quiz data not found. Make sure you've completed a quiz first."
          );
        }

        // Add logging to track the API request - now using quizId as the UUID
        console.log(
          `Fetching review data from: /api/quizzes/${quizId}/review?userId=${userId}`
        );

        const response = await fetch(
          `/api/quizzes/${quizId}/review?userId=${userId}`
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API error response:", errorText);
          throw new Error(
            `Failed to fetch quiz review data: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("Retrieved review data:", data);
        setReviewState(data);
        setLoading(false);
      } catch (err) {
        console.error("Error loading quiz for review:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    loadQuizForReview();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your quiz questions...</p>
      </div>
    );
  }

  if (error || !reviewState) {
    return (
      <div className="container mx-auto p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 inline-block">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-600">{error || "No quiz data found"}</p>
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

  return (
    <div className="container mx-auto p-4 max-w-4xl min-h-screen">
      {/* Header */}
      <div className="text-center my-8">
        <h1 className="text-4xl font-bold text-blue-700 mb-2">
          Review Questions
        </h1>
        <p className="text-gray-600 mb-6">
          Review all questions and answers from your quiz
        </p>
      </div>

      {/* Questions List */}
      <div className="space-y-8">
        {reviewState.questions.map((question, index) => (
          <div
            key={question.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            {/* Question Topic */}
            <div className="bg-blue-100 text-blue-800 px-4 py-2 text-sm font-medium rounded-t-lg">
              {question.topic}
            </div>

            {/* Question Text */}
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-6">
                {index + 1}. {question.question}
              </h3>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {question.options.map((option, optionIndex) => {
                  const isCorrectAnswer = Array.isArray(question.correctAnswer)
                    ? question.correctAnswer.includes(option)
                    : question.correctAnswer === option;

                  const isUserAnswer = Array.isArray(question.userAnswer)
                    ? question.userAnswer.includes(option)
                    : question.userAnswer === option;

                  let optionClass = "border rounded-md p-4";

                  if (isCorrectAnswer) {
                    optionClass += " bg-green-50 border-green-200";
                  } else if (isUserAnswer && !isCorrectAnswer) {
                    optionClass += " bg-red-50 border-red-200";
                  } else {
                    optionClass += " border-gray-200";
                  }

                  return (
                    <div key={optionIndex} className={optionClass}>
                      {option}
                      {isCorrectAnswer && (
                        <span className="ml-2 text-green-600 font-medium">
                          (Correct Answer)
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h4 className="font-semibold mb-2">Explanation:</h4>
                <p className="text-gray-700">{question.explanation}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-center mt-10 mb-8">
        <button
          className="border border-gray-300 hover:bg-gray-100 text-gray-800 font-medium py-3 px-8 rounded-md flex items-center"
          onClick={() => router.push("/results")}
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Results
        </button>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-md ml-4"
          onClick={() => {
            // Clear any existing quiz data from localStorage
            localStorage.removeItem("quizId");
            localStorage.removeItem("quizState");
            localStorage.removeItem("quizStartTime");
            localStorage.removeItem("quizEndTime");
            // Redirect to the home page
            router.push("/");
          }}
        >
          Take Another Quiz
        </button>
      </div>
    </div>
  );
}

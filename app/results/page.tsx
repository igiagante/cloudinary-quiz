// results/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { QuizQuestion, QuizState, Topic } from "@/types";

interface TopicScore {
  name: string;
  score: number;
  possible: number;
  weight?: number; // Optional weight for calculating weighted scores
}

interface QuizResults {
  completedAt: string;
  duration: string;
  topicScores: TopicScore[];
  totalQuestions?: number; // Total number of questions in the certification exam
}

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<QuizResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPassed, setIsPassed] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Debug component for development
  const DebugInfo = () => {
    const [storage, setStorage] = useState<Record<string, string>>({});

    useEffect(() => {
      // Collect localStorage data
      const storageData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          storageData[key] = localStorage.getItem(key) || "";
        }
      }
      setStorage(storageData);
    }, []);

    return (
      <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs font-mono">
        <h3 className="font-bold mb-2">Debug Info (localStorage)</h3>
        <pre>{JSON.stringify(storage, null, 2)}</pre>
      </div>
    );
  };

  useEffect(() => {
    // Fetch quiz results from API
    const fetchResults = async () => {
      try {
        // Check if demo mode is enabled via URL
        const isDemo =
          new URLSearchParams(window.location.search).get("demo") === "true";

        // Get quiz ID - try both formats (uuid and id)
        let quizId = localStorage.getItem("quizId");

        // If no quizId, check for session storage and URL parameters
        if (!quizId) {
          quizId =
            sessionStorage.getItem("quizId") ||
            new URLSearchParams(window.location.search).get("quizId");
        }

        // Get user ID with fallbacks
        let userId = localStorage.getItem("userId");
        if (!userId) {
          userId =
            sessionStorage.getItem("userId") ||
            localStorage.getItem("user_id") ||
            sessionStorage.getItem("user_id") ||
            "anonymous";
        }

        // For development or demo mode - provide mock data
        if (
          isDemo ||
          (process.env.NODE_ENV === "development" && (!quizId || !userId))
        ) {
          console.log(
            "Using demo data for results page, but calculating real topic scores"
          );

          try {
            // Try to get questions data from localStorage
            const rawQuizData = localStorage.getItem("quizState");

            if (rawQuizData) {
              const quizData = JSON.parse(rawQuizData) as QuizState;
              const questions = quizData.questions || [];

              if (questions.length > 0) {
                // Get start and end times from localStorage if available
                const startTime = localStorage.getItem("quizStartTime");
                const endTime =
                  localStorage.getItem("quizEndTime") ||
                  new Date().toISOString();

                // Calculate duration
                let duration = "00:00:00";
                if (startTime) {
                  const start = new Date(startTime).getTime();
                  const end = new Date(endTime).getTime();
                  const durationMs = end - start;

                  // Format as hh:mm:ss
                  const hours = Math.floor(durationMs / (1000 * 60 * 60));
                  const minutes = Math.floor(
                    (durationMs % (1000 * 60 * 60)) / (1000 * 60)
                  );
                  const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

                  duration = `${hours.toString().padStart(2, "0")}:${minutes
                    .toString()
                    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
                }

                // Group questions by topic
                const topicMap: Record<
                  string,
                  { correct: number; total: number }
                > = {};

                questions.forEach((q: QuizQuestion) => {
                  const topic = q.topic || "Unknown";

                  if (!topicMap[topic]) {
                    topicMap[topic] = { correct: 0, total: 0 };
                  }

                  topicMap[topic].total += 1;

                  // If the question is answered and the answer is correct
                  const questionId = q.id;
                  const userAnswer = quizData.userAnswers[questionId];
                  if (
                    userAnswer !== undefined &&
                    userAnswer === q.correctAnswer
                  ) {
                    topicMap[topic].correct += 1;
                  }
                });

                // Convert to the expected topicScores format
                const topicScores = Object.entries(topicMap).map(
                  ([name, data]) => ({
                    name,
                    score: data.correct,
                    possible: data.total,
                    // Optional: calculate weight based on certification exam
                    weight: data.total / questions.length,
                  })
                );

                // Set the calculated results
                setResults({
                  completedAt: endTime,
                  duration: duration,
                  totalQuestions: questions.length,
                  topicScores,
                });

                // Calculate overall score and determine if passed
                const totalCorrect = Object.values(topicMap).reduce(
                  (sum, data) => sum + data.correct,
                  0
                );
                const totalQuestions = Object.values(topicMap).reduce(
                  (sum, data) => sum + data.total,
                  0
                );
                const percentage = (totalCorrect / totalQuestions) * 100;

                setIsPassed(percentage >= 70);
                setLoading(false);
                return;
              }
            }
          } catch (error) {
            console.error(
              "Error calculating results from local storage:",
              error
            );
          }

          // Fallback to demo data if we can't calculate real results
          console.log("Falling back to static demo data");
          setResults({
            completedAt: new Date().toISOString(),
            duration: "1:05:36",
            totalQuestions: 65,
            topicScores: [
              {
                name: "Products, Value, Environment Settings, and Implementation Strategies",
                score: 3,
                possible: 9,
                weight: 0.14,
              },
              { name: "Transformations", score: 7, possible: 11, weight: 0.17 },
              {
                name: "Upload and Migrate Assets",
                score: 5,
                possible: 6,
                weight: 0.09,
              },
              {
                name: "Media Lifecycle Strategy and Emerging Trends",
                score: 2,
                possible: 6,
                weight: 0.09,
              },
              {
                name: "User, Role, and Group Management and Access Controls",
                score: 7,
                possible: 9,
                weight: 0.14,
              },
              {
                name: "Media Management",
                score: 6,
                possible: 10,
                weight: 0.15,
              },
              {
                name: "Widgets, Out of Box Add-ons, Custom Integrations",
                score: 5,
                possible: 10,
                weight: 0.15,
              },
              {
                name: "System Architecture",
                score: 3,
                possible: 4,
                weight: 0.06,
              },
            ],
          });

          setIsPassed(false);
          setLoading(false);
          return;
        }

        if (!quizId) {
          throw new Error("Quiz data not found");
        }

        const response = await fetch(
          `/api/quiz-results?quizId=${quizId}&userId=${userId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch results");
        }

        const data = await response.json();

        // Ensure we have topic scores in some form
        if (!data) {
          console.error("Empty response from API");
          throw new Error("No quiz results received");
        }

        // Make sure either topicScores or topicPerformance exists
        if (!data.topicScores && !data.topicPerformance) {
          console.warn(
            "No topic performance data in response, using empty arrays as fallback"
          );
          data.topicScores = [];
          data.topicPerformance = [];
        }

        // Make sure arrays are actually arrays
        if (data.topicScores && !Array.isArray(data.topicScores)) {
          console.warn(
            "topicScores is not an array, converting to empty array"
          );
          data.topicScores = [];
        }

        if (data.topicPerformance && !Array.isArray(data.topicPerformance)) {
          console.warn(
            "topicPerformance is not an array, converting to empty array"
          );
          data.topicPerformance = [];
        }

        // Convert API response to our expected format
        const topicScores =
          data.topicScores ||
          (data.topicPerformance || []).map((tp: any) => ({
            name: tp.topic,
            score: tp.correct,
            possible: tp.total,
            weight: tp.total / data.totalQuestions,
          }));

        // Format duration if available
        let duration = "00:00:00";
        if (data.duration) {
          duration = data.duration;
        } else if (data.completedAt && data.createdAt) {
          const start = new Date(data.createdAt).getTime();
          const end = new Date(data.completedAt).getTime();
          const durationMs = end - start;

          // Format as hh:mm:ss
          const hours = Math.floor(durationMs / (1000 * 60 * 60));
          const minutes = Math.floor(
            (durationMs % (1000 * 60 * 60)) / (1000 * 60)
          );
          const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

          duration = `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        }

        // Set the results with proper formatting
        setResults({
          completedAt: data.completedAt || new Date().toISOString(),
          duration: duration,
          totalQuestions:
            data.totalQuestions ||
            topicScores.reduce((sum: number, tp: any) => sum + tp.possible, 0),
          topicScores: topicScores,
        });

        // Calculate overall score and determine if passed
        const totalScore = topicScores.reduce(
          (sum: number, topic: TopicScore) => sum + topic.score,
          0
        );
        const totalPossible = topicScores.reduce(
          (sum: number, topic: TopicScore) => sum + topic.possible,
          0
        );
        const percentage =
          totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;
        setIsPassed(percentage >= 70);

        setLoading(false);
      } catch (err: unknown) {
        console.error("Error fetching results:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your quiz results...</p>
        {process.env.NODE_ENV === "development" && (
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="mt-4 text-xs text-gray-500 underline"
          >
            {showDebug ? "Hide Debug" : "Show Debug"}
          </button>
        )}
        {showDebug && <DebugInfo />}
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="container mx-auto p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 inline-block">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-600">{error || "No results found"}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
          >
            Go Back Home
          </button>
        </div>
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs text-gray-500 underline"
            >
              {showDebug ? "Hide Debug" : "Show Debug"}
            </button>
            {showDebug && <DebugInfo />}
          </div>
        )}
      </div>
    );
  }

  // Calculate total score
  const totalScore = results.topicScores.reduce(
    (sum, topic) => sum + topic.score,
    0
  );
  const totalPossible = results.topicScores.reduce(
    (sum, topic) => sum + topic.possible,
    0
  );
  const overallPercentage = Math.round((totalScore / totalPossible) * 100) || 0;

  // Filter out topics with zero possible to avoid NaN percentages
  const validTopics = results.topicScores.filter((topic) => topic.possible > 0);

  // Get topics that need improvement (less than 70% correct)
  const topicsToImprove = validTopics
    .filter((topic) => {
      const percentage = (topic.score / topic.possible) * 100;
      return percentage < 70;
    })
    .map((topic) => topic.name);

  // Action Buttons
  const handleTakeAnotherQuiz = () => {
    // Clear any existing quiz data from localStorage
    localStorage.removeItem("quizId");
    localStorage.removeItem("quizState");
    localStorage.removeItem("quizStartTime");
    localStorage.removeItem("quizEndTime");
    // Redirect to the home page
    router.push("/");
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Enhanced Header Section */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">
          Quiz Results <span className="text-blue-600">📊</span>
        </h1>
        <p className="text-gray-600 mb-6">
          Thanks for completing the Cloudinary certification practice quiz!
        </p>
      </div>

      {/* Score Card - Redesigned to match screenshot */}
      <div className="bg-blue-50 p-8 rounded-lg mb-8 text-center">
        <div className="text-6xl font-bold">
          {totalScore.toFixed(1)} / {totalPossible.toFixed(1)}
        </div>
        <div className="mt-2 flex justify-center items-center">
          <span
            className={`text-xl font-medium ${
              isPassed ? "text-green-600" : "text-red-600"
            }`}
          >
            {overallPercentage}% Overall
          </span>
          <span className="ml-4 text-gray-600">
            {isPassed ? "✓ Passed" : "✕ Not Passed"}
          </span>
        </div>
      </div>

      {/* Header with completion details */}
      <div className="flex justify-between items-center mb-8 py-3 border-y border-gray-200">
        <div className="flex items-center text-gray-700">
          <svg
            className="w-5 h-5 text-blue-500 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Completed: {new Date(results.completedAt).toLocaleString()}
        </div>
        <div className="flex items-center text-gray-700">
          <svg
            className="w-5 h-5 text-blue-500 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Duration: {results.duration}
        </div>
      </div>

      {/* Results Breakdown */}
      <div className="mb-12">
        <h2 className="text-4xl font-bold mb-8 flex items-center">
          <svg
            className="w-7 h-7 text-blue-500 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Breakdown
        </h2>

        <div>
          {results.topicScores.map((topic: TopicScore, index: number) => {
            // Skip topics with 0 possible questions to avoid NaN
            if (topic.possible === 0) return null;

            const percentage = Math.round((topic.score / topic.possible) * 100);
            const bgColor = index % 2 === 0 ? "bg-gray-100" : "bg-white";

            return (
              <div
                key={index}
                className={`py-4 px-6 ${bgColor} flex justify-between items-center`}
              >
                <div className="flex-1">
                  <p className="text-lg">
                    {index + 1}. {topic.name}
                  </p>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="font-mono">
                    {topic.score.toFixed(1)} / {topic.possible.toFixed(1)}
                  </div>
                  <div className="bg-gray-200 px-4 py-1 rounded-full text-center w-20">
                    {percentage}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      {topicsToImprove.length > 0 && (
        <div className="mt-12 mb-12">
          <div className="flex items-center mb-4">
            <svg
              className="w-6 h-6 text-blue-600 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"></path>
            </svg>
            <h2 className="text-2xl font-bold">Recommendations</h2>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <ul className="space-y-4">
              {topicsToImprove.map((topic, index) => (
                <li key={index} className="flex">
                  <div className="text-blue-600 mr-2">•</div>
                  <div>
                    <span>Focus on studying </span>
                    <span className="font-semibold">{topic}</span>
                    <span> concepts in the Cloudinary documentation</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Debug Information Panel */}
      <div className="mb-8 p-4 border border-yellow-300 bg-yellow-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
        <div className="space-y-2 text-sm">
          <p>Quiz ID: {localStorage.getItem("quizId") || "Not found"}</p>
          <p>User ID: {localStorage.getItem("userId") || "Not found"}</p>
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="mt-4 text-xs border border-gray-400 px-2 py-1 rounded"
          >
            {showDebug ? "Hide Detailed Debug" : "Show Detailed Debug"}
          </button>
          {showDebug && <DebugInfo />}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mt-12">
        <button
          className="border border-gray-300 hover:bg-gray-100 text-gray-800 font-medium py-3 px-8 rounded-md flex items-center"
          onClick={handleTakeAnotherQuiz}
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
          Take Another Quiz
        </button>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-md"
          onClick={() => router.push("/review-quiz")}
        >
          Review All Questions
        </button>
      </div>
    </div>
  );
}

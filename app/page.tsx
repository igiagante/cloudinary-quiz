// app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cloudinaryTopicList } from "@/types/constants";
import { Topic } from "@/types";
import AdminLink from "@/components/admin-link";
import { v4 as uuidv4 } from "uuid";
import { debug } from "@/lib/debug";

export default function Home() {
  const router = useRouter();
  const [numQuestions, setNumQuestions] = useState(10);
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
  const [difficulty, setDifficulty] = useState<
    "easy" | "medium" | "hard" | "mixed"
  >("mixed");
  const [model, setModel] = useState<"openai" | "claude" | "none">("none");
  const [forceGenerate, setForceGenerate] = useState(false);
  const [maxNewQuestions, setMaxNewQuestions] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [dbStats, setDbStats] = useState<{ totalQuestions: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Check if we need to clear an unfinished quiz
    const quizState = localStorage.getItem("quizState");
    if (quizState) {
      try {
        const parsedState = JSON.parse(quizState);
        // If quiz is not complete, offer to clear it
        if (
          !parsedState.isComplete &&
          parsedState.questions &&
          parsedState.questions.length > 0
        ) {
          // Auto-clear unfinished quizzes to prevent state issues
          localStorage.removeItem("quizState");
          debug.log("Cleared unfinished quiz state on home page load");

          // No need to remove quizId as it will be reused
        }
      } catch (e) {
        // If there's any error parsing, clear it
        localStorage.removeItem("quizState");
        debug.error("Error parsing quiz state, cleared it:", e);
      }
    }
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/stats");
        if (!response.ok) {
          throw new Error("Failed to fetch stats");
        }
        const data = await response.json();
        setDbStats({ totalQuestions: data.totalQuestions });
      } catch (error) {
        debug.error("Error fetching stats:", error);
        setDbStats({ totalQuestions: 0 });
      }
    };
    fetchStats();
  }, []);

  const handleTopicToggle = (topic: Topic) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setNumQuestions(value);
  };

  const handleStartQuiz = async () => {
    if (isGenerating) return;

    // Validate topic selection
    if (selectedTopics.length === 0) {
      setError("Please select at least one topic before starting the quiz");
      return;
    }

    setIsGenerating(true);
    setError(null);

    // Initialize progress tracking
    const progressEl = document.getElementById("generation-progress");
    const updateProgress = (message: string) => {
      if (progressEl) {
        progressEl.innerHTML += `<div>${message}</div>`;
        progressEl.scrollTop = progressEl.scrollHeight;
      }
    };

    try {
      // Replace with your actual user ID from the database
      const existingUserId = "a77c7b9b-aa9d-4f90-b70a-ab74206a7d8e";
      localStorage.setItem("userId", existingUserId);

      // Save quiz settings to localStorage
      updateProgress("Saving quiz settings...");
      localStorage.setItem(
        "quizSettings",
        JSON.stringify({
          numQuestions,
          topics: selectedTopics,
          difficulty,
          model,
          maxNewQuestions,
          forceGenerate,
        })
      );

      // Show more details about what's happening
      updateProgress(
        `Preparing to generate ${numQuestions} ${difficulty} questions on: ${selectedTopics.join(
          ", "
        )}`
      );

      // Fetch generated questions
      updateProgress("Sending request to generate questions...");

      // Create a clean, properly typed request body
      const requestBody = {
        numQuestions: Number(numQuestions),
        topics: selectedTopics, // Always send selected topics, no undefined fallback
        difficulty: difficulty === "mixed" ? undefined : difficulty,
        model,
        maxNewQuestions,
      };

      debug.log("Sending request with body:", JSON.stringify(requestBody));

      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate questions");
      }

      const data = await response.json();
      const questions = data.questions;
      const progressLogs = data.progressLogs || [];

      // Display any progress logs we received from the server
      if (progressLogs && progressLogs.length > 0) {
        progressLogs.forEach((log: string) => updateProgress(log));
      }

      // Debug any issues with questions
      if (!questions || questions.length === 0) {
        updateProgress(
          "Warning: No questions were generated. Please try again."
        );
        debug.error("No questions generated:", data);
        throw new Error("No questions were generated");
      }

      // Log the structure of the first question to debug any issues
      debug.log(
        "First question structure:",
        JSON.stringify(questions[0], null, 2)
      );

      // Check if the question has options and they're properly formatted
      if (
        !questions[0].options ||
        !Array.isArray(questions[0].options) ||
        questions[0].options.length === 0
      ) {
        updateProgress(
          "Warning: Questions were generated but appear to be missing options."
        );
        debug.error("Question missing options:", questions[0]);
      }

      // After the first question structure console log, add this:
      debug.log(
        "Question IDs being sent to create quiz:",
        JSON.stringify(
          questions.map((q: { id: string }) => q.id),
          null,
          2
        )
      );

      debug.log(
        "Question IDs format from API:",
        questions.map((q: { id: string }) => q.id)
      );

      updateProgress("Quiz generation successful! Preparing your quiz...");

      // Create a quiz in the database
      updateProgress("Creating quiz in database...");
      const createQuizResponse = await fetch("/api/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: existingUserId,
          numQuestions: questions.length,
          questionIds: questions.map((q: { id: string }) => q.id),
        }),
      });

      if (!createQuizResponse.ok) {
        const errorData = await createQuizResponse.json();
        debug.error("Failed to create quiz in database:", errorData);
        updateProgress(
          "Warning: Failed to save quiz to database. Continuing anyway..."
        );
      } else {
        const quizData = await createQuizResponse.json();
        // Save the quiz ID to localStorage
        localStorage.setItem(
          "quizId",
          typeof quizData.quizId === "object"
            ? quizData.quizId.uuid || String(quizData.quizId)
            : String(quizData.quizId)
        );
        updateProgress("Quiz saved to database successfully!");
      }

      // Add the questions to the quiz state
      const quizState = {
        questions,
        currentQuestionIndex: 0,
        userAnswers: {},
        isComplete: false,
      };

      // Debug multiple-answer questions
      debug.log("Quiz state being stored:", JSON.stringify(quizState));
      const multipleAnswerQuestions = questions.filter(
        (q: any) => q.hasMultipleCorrectAnswers
      );
      debug.log(
        `Found ${multipleAnswerQuestions.length} multiple-answer questions`
      );
      if (multipleAnswerQuestions.length > 0) {
        multipleAnswerQuestions.forEach((q: any, i: number) => {
          debug.log(`Multiple answer Q${i + 1}:`, {
            question: q.question.substring(0, 50) + "...",
            hasFlag: q.hasMultipleCorrectAnswers,
            correctAnswers: q.correctAnswers,
            options: q.options.length,
          });
        });
      }

      // Save the quiz state to localStorage
      localStorage.setItem("quizState", JSON.stringify(quizState));

      // Navigate to the quiz page
      router.push("/quiz");
    } catch (error) {
      debug.error("Error generating quiz:", error);
      updateProgress(
        `Error: ${
          error instanceof Error ? error.message : "Something went wrong"
        }`
      );
      setTimeout(() => {
        setIsGenerating(false);
      }, 3000);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Cloudinary Certification Quiz
        </h1>
        <p className="text-gray-600">
          Test your knowledge and prepare for the Cloudinary certification exam
        </p>

        {dbStats && dbStats.totalQuestions > 0 && (
          <div className="mt-2 text-sm text-gray-500">
            {dbStats.totalQuestions} questions available in the database
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Quiz Settings</h2>

        {isGenerating && (
          <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-100">
            <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generating Quiz
            </h3>
            <div
              id="generation-progress"
              className="text-xs text-blue-700 bg-blue-100 p-3 rounded max-h-40 overflow-y-auto"
            >
              <p>Initializing quiz generation...</p>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Using database-cached questions where available for faster
              generation. AI models will only be used for new topics or when
              cached questions aren't available.
            </p>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Questions: {numQuestions}
          </label>
          <input
            type="range"
            min="5"
            max="30"
            step="5"
            value={numQuestions}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>5</span>
            <span>10</span>
            <span>15</span>
            <span>20</span>
            <span>25</span>
            <span>30</span>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Topics:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {cloudinaryTopicList.map((topic) => (
              <div
                key={topic}
                onClick={() => handleTopicToggle(topic)}
                className={`cursor-pointer p-3 rounded border ${
                  selectedTopics.includes(topic)
                    ? "bg-blue-100 border-blue-300"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <div className="text-sm font-medium">{topic}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {selectedTopics.length === 0
              ? "Please select at least one topic"
              : `${selectedTopics.length} topics selected`}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty:
          </label>
          <div className="flex space-x-2">
            {["easy", "medium", "hard", "mixed"].map((diff) => (
              <button
                key={diff}
                onClick={() =>
                  setDifficulty(diff as "easy" | "medium" | "hard" | "mixed")
                }
                className={`px-3 py-1 rounded-full text-sm ${
                  difficulty === diff
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                }`}
              >
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Question Source
            </label>
          </div>
          <div className="mt-2 bg-gray-50 p-4 rounded-md border border-gray-200">
            <div className="flex flex-col space-y-3">
              <div
                onClick={() => setModel("none")}
                className={`flex items-center cursor-pointer p-2 rounded ${
                  model === "none" ? "bg-blue-50 border border-blue-200" : ""
                }`}
              >
                <input
                  type="radio"
                  checked={model === "none"}
                  onChange={() => setModel("none")}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-700">
                    Database Only
                  </span>
                  <p className="text-xs text-gray-500">
                    Use existing high-quality questions from database (fastest)
                  </p>
                </div>
              </div>

              <div
                onClick={() => setModel("claude")}
                className={`flex items-center cursor-pointer p-2 rounded ${
                  model === "claude" ? "bg-blue-50 border border-blue-200" : ""
                }`}
              >
                <input
                  type="radio"
                  checked={model === "claude"}
                  onChange={() => setModel("claude")}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-700">
                    Database + Claude
                  </span>
                  <p className="text-xs text-gray-500">
                    Use database questions and generate additional ones with
                    Claude if needed
                  </p>
                </div>
              </div>

              <div
                onClick={() => setModel("openai")}
                className={`flex items-center cursor-pointer p-2 rounded ${
                  model === "openai" ? "bg-blue-50 border border-blue-200" : ""
                }`}
              >
                <input
                  type="radio"
                  checked={model === "openai"}
                  onChange={() => setModel("openai")}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-700">
                    Database + OpenAI
                  </span>
                  <p className="text-xs text-gray-500">
                    Use database questions and generate additional ones with
                    OpenAI if needed
                  </p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Note: Database questions are already high-quality, realistic
            questions created using Claude.
          </p>
        </div>

        {model !== "none" && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum New Questions to Generate: {maxNewQuestions}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={maxNewQuestions}
              onChange={(e) => setMaxNewQuestions(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Limit how many new questions to generate (lower numbers are
              faster)
            </p>
          </div>
        )}

        <button
          onClick={handleStartQuiz}
          disabled={isGenerating}
          className={`w-full py-2 px-4 rounded-md ${
            isGenerating
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          } font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {isGenerating ? "Generating..." : "Start Quiz"}
        </button>
      </div>

      <div className="bg-blue-50 rounded-lg border border-blue-100 p-4">
        <h3 className="text-md font-medium mb-2">
          About Cloudinary Certification
        </h3>
        <p className="text-sm text-gray-700">
          The Cloudinary Certification requires an 80% passing score. This
          practice quiz helps you prepare by testing your knowledge across key
          Cloudinary topics and identifying areas for improvement. Regular
          practice will increase your chances of passing the certification exam.
        </p>
      </div>

      <AdminLink />

      {/* Admin/Debug Section */}
      <div className="mt-20 pt-6 border-t border-gray-200">
        <div className="flex justify-center">
          <button
            onClick={() => {
              // Clear quiz related data
              localStorage.removeItem("quizState");
              localStorage.removeItem("quizId");
              localStorage.removeItem("quizSettings");

              // Show confirmation
              alert("Quiz data has been reset. You can start a new quiz now.");

              // Refresh the page
              window.location.reload();
            }}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Reset Quiz Data
          </button>
        </div>
      </div>
    </main>
  );
}

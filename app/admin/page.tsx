// app/admin/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { cloudinaryTopicList } from "@/types/constants";
import { QuizQuestion, Topic } from "@/types";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState<{
    totalQuestions: number;
    byTopic: Record<Topic, number>;
    byDifficulty: Record<string, number>;
  } | null>(null);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [filterTopic, setFilterTopic] = useState<Topic | "all">("all");
  const [filterDifficulty, setFilterDifficulty] = useState<
    "all" | "easy" | "medium" | "hard"
  >("all");
  const [selectedQuestion, setSelectedQuestion] = useState<QuizQuestion | null>(
    null
  );
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load stats and questions
    loadStatsFromApi();
    loadQuestionsFromApi();
  }, []);

  const loadStatsFromApi = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/stats");
      if (!response.ok) {
        throw new Error(`Failed to load stats: ${response.statusText}`);
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error loading stats from API:", err);
      setError(
        "Failed to load database statistics. Please check server connection."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionsFromApi = async () => {
    try {
      const response = await fetch("/api/questions");
      if (!response.ok) {
        throw new Error(`Failed to load questions: ${response.statusText}`);
      }
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (err) {
      console.error("Error loading questions from API:", err);
      setError("Failed to load questions from the database");
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const topicMatch = filterTopic === "all" || q.topic === filterTopic;
    const difficultyMatch =
      filterDifficulty === "all" || q.difficulty === filterDifficulty;
    return topicMatch && difficultyMatch;
  });

  const handleDeleteQuestion = (question: QuizQuestion) => {
    setSelectedQuestion(question);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedQuestion) return;

    try {
      // Use API endpoint for deletion
      const response = await fetch(`/api/questions/${selectedQuestion.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete question");
      }

      // Refresh the data
      loadQuestionsFromApi();
      loadStatsFromApi();
    } catch (error) {
      console.error("Error deleting question:", error);
    }

    // Close the modal
    setIsConfirmModalOpen(false);
    setSelectedQuestion(null);
  };

  const handleClearAll = async () => {
    if (
      confirm(
        "Are you sure you want to delete ALL questions? This cannot be undone."
      )
    ) {
      try {
        // Use API endpoint for clearing all
        const response = await fetch("/api/questions/clear-all", {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to clear questions");
        }

        // Refresh the data
        loadQuestionsFromApi();
        loadStatsFromApi();
      } catch (error) {
        console.error("Error clearing questions:", error);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="space-x-4">
          <Link
            href="/admin/upload"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Upload Questions
          </Link>
          <Link
            href="/admin/docs"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Documentation
          </Link>
          <Link href="/" className="text-blue-600 hover:underline">
            Back to Home
          </Link>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Database Statistics</h2>

        {loading ? (
          <p>Loading statistics...</p>
        ) : stats && stats.totalQuestions > 0 ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="text-center">
                <span className="block text-3xl font-bold text-blue-600">
                  {stats.totalQuestions}
                </span>
                <span className="text-gray-600">Total Questions</span>
              </div>

              <div className="text-center">
                <span className="block text-3xl font-bold text-green-600">
                  {Object.keys(stats.byTopic).length}
                </span>
                <span className="text-gray-600">Topics Covered</span>
              </div>

              <div className="text-center">
                <span className="block text-3xl font-bold text-purple-600">
                  {stats.byDifficulty.easy || 0}
                </span>
                <span className="text-gray-600">Easy Questions</span>
              </div>

              <div className="text-center">
                <span className="block text-3xl font-bold text-yellow-600">
                  {stats.byDifficulty.medium || 0}
                </span>
                <span className="text-gray-600">Medium Questions</span>
              </div>

              <div className="text-center">
                <span className="block text-3xl font-bold text-red-600">
                  {stats.byDifficulty.hard || 0}
                </span>
                <span className="text-gray-600">Hard Questions</span>
              </div>
            </div>

            <h3 className="font-semibold mb-2">Questions by Topic</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {cloudinaryTopicList.map((topic) => (
                <div key={topic} className="flex justify-between p-2 border-b">
                  <span>{topic}</span>
                  <span className="font-semibold">
                    {stats.byTopic[topic] || 0}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleClearAll}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow-sm"
              >
                Clear All Questions
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-lg text-gray-600 mb-4">
              No questions found in the database
            </p>
            <p className="text-gray-500 mb-6">
              Generate questions by starting a quiz from the home page.
            </p>
            <Link
              href="/"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow-sm"
            >
              Go to Quiz Generator
            </Link>
          </div>
        )}
      </div>

      {/* Question List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Question List</h2>

          {questions.length > 0 && (
            <div className="flex space-x-4">
              <select
                value={filterTopic}
                onChange={(e) =>
                  setFilterTopic(e.target.value as Topic | "all")
                }
                className="border rounded px-3 py-2"
              >
                <option value="all">All Topics</option>
                {cloudinaryTopicList.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>

              <select
                value={filterDifficulty}
                onChange={(e) =>
                  setFilterDifficulty(
                    e.target.value as "all" | "easy" | "medium" | "hard"
                  )
                }
                className="border rounded px-3 py-2"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          )}
        </div>

        <div className="mt-4">
          {loading ? (
            <p className="text-center py-10 text-gray-500">
              Loading questions...
            </p>
          ) : filteredQuestions.length > 0 ? (
            <div className="space-y-6">
              {filteredQuestions.map((question) => (
                <div key={question.id} className="border p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-500">
                      Topic: {question.topic}
                    </span>
                    <span className="text-sm px-2 py-1 bg-gray-100 rounded">
                      {question.difficulty.charAt(0).toUpperCase() +
                        question.difficulty.slice(1)}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold mb-2">
                    {question.question}
                  </h3>

                  <div className="space-y-2 mb-4">
                    {question.options.map((option, index) => {
                      const isCorrect = question.hasMultipleCorrectAnswers
                        ? Array.isArray(question.correctAnswers) &&
                          question.correctAnswers.includes(option)
                        : option === question.correctAnswer;

                      return (
                        <div
                          key={index}
                          className={`p-2 rounded-md ${
                            isCorrect
                              ? "bg-green-50 border border-green-200"
                              : "bg-gray-50"
                          }`}
                        >
                          <span className="font-medium mr-2">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          {option}
                          {isCorrect && (
                            <span className="ml-2 text-green-600 font-medium text-sm">
                              (Correct)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-sm text-gray-700 mb-4">
                    <span className="font-medium">Explanation:</span>{" "}
                    {question.explanation}
                  </p>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleDeleteQuestion(question)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete Question
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-10 text-gray-500">
              No questions match the selected filters. Try adjusting your
              filters or generate some questions.
            </p>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-6">
              Are you sure you want to delete this question? This action cannot
              be undone.
            </p>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

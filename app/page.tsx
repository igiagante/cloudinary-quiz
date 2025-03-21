// app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CLOUDINARY_TOPIC_LIST } from "@/lib/cloudinary-topics";
import { Topic } from "@/types";
import { questionRepository } from "@/lib/db/repositories/question.repository";
import AdminLink from "@/components/admin-link";

export default function Home() {
  const router = useRouter();
  const [numQuestions, setNumQuestions] = useState(10);
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
  const [difficulty, setDifficulty] = useState<
    "easy" | "medium" | "hard" | "mixed"
  >("mixed");
  const [isLoading, setIsLoading] = useState(false);
  const [dbStats, setDbStats] = useState<{ totalQuestions: number } | null>(
    null
  );

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const questions = await questionRepository.getAll();
        setDbStats({ totalQuestions: questions.length });
      } catch (error) {
        console.error("Error fetching questions:", error);
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

  const handleStartQuiz = async () => {
    setIsLoading(true);

    try {
      // Generate quiz questions from the database
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numQuestions,
          topics: selectedTopics.length > 0 ? selectedTopics : undefined,
          difficulty: difficulty === "mixed" ? undefined : difficulty,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate quiz");
      }

      const data = await response.json();

      // Store quiz state in the database or session
      // For now, we'll keep using localStorage until we set up the quiz session table
      localStorage.setItem(
        "quizState",
        JSON.stringify({
          questions: data.questions,
          currentQuestionIndex: 0,
          userAnswers: {},
          isComplete: false,
        })
      );

      // Navigate to quiz page
      router.push("/quiz");
    } catch (error) {
      console.error("Error starting quiz:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
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

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Questions
          </label>
          <input
            type="range"
            min="5"
            max="30"
            step="5"
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>5</span>
            <span>10</span>
            <span>15</span>
            <span>20</span>
            <span>25</span>
            <span>30</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Selected: {numQuestions} questions
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty Level
          </label>
          <div className="grid grid-cols-4 gap-2">
            {["easy", "medium", "hard", "mixed"].map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level as any)}
                className={`py-2 px-4 rounded-md text-sm font-medium ${
                  difficulty === level
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Topics{" "}
            {selectedTopics.length > 0 && `(${selectedTopics.length} selected)`}
          </label>
          <p className="mt-1 mb-3 text-sm text-gray-500">
            {selectedTopics.length === 0
              ? "All topics will be included randomly"
              : "Only selected topics will be included"}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {CLOUDINARY_TOPIC_LIST.map((topic) => (
              <div
                key={topic}
                onClick={() => handleTopicToggle(topic)}
                className={`p-3 rounded-md cursor-pointer border ${
                  selectedTopics.includes(topic)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start">
                  <div
                    className={`w-5 h-5 flex items-center justify-center rounded-sm mr-2 ${
                      selectedTopics.includes(topic)
                        ? "bg-blue-500 text-white"
                        : "border border-gray-300"
                    }`}
                  >
                    {selectedTopics.includes(topic) && "✓"}
                  </div>
                  <span className="text-sm">{topic}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleStartQuiz}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? "Generating Quiz..." : "Start Quiz"}
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
    </main>
  );
}

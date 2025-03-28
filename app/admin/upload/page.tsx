"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import QuestionUpload, { QuestionInput } from "@/components/question-upload";
import Link from "next/link";
import { Topic } from "@/types";

export default function UploadPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionInput[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleQuestionsUploaded = (newQuestions: QuestionInput[]) => {
    setQuestions(newQuestions);
  };

  const handleSaveToDatabase = async () => {
    if (questions.length === 0) {
      setError("No questions to save. Upload questions first.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/questions/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questions }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save questions");
      }

      const result = await response.json();
      setSuccess(
        `Successfully saved ${result.count} questions to the database`
      );
      setQuestions([]);
    } catch (err) {
      console.error("Error saving questions:", err);
      setError(err instanceof Error ? err.message : "Failed to save questions");
    } finally {
      setUploading(false);
    }
  };

  const clearAll = () => {
    setQuestions([]);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Question Upload</h1>
        <Link href="/admin" className="text-blue-600 hover:text-blue-800">
          Back to Admin
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <QuestionUpload onQuestionsUploaded={handleQuestionsUploaded} />

        {questions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {questions.length} Questions Ready
              </h2>
              <div className="space-x-2">
                <button
                  onClick={clearAll}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded-md"
                >
                  Clear All
                </button>
                <button
                  onClick={handleSaveToDatabase}
                  disabled={uploading}
                  className="px-4 py-1 text-sm bg-green-600 text-white rounded-md disabled:opacity-50"
                >
                  {uploading ? "Saving..." : "Save to Database"}
                </button>
              </div>
            </div>

            <div className="overflow-auto max-h-96">
              {questions.map((q, i) => (
                <div key={i} className="p-3 border rounded-md mb-3">
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Topic: {q.topic} | Difficulty: {q.difficulty}
                  </div>
                  <div className="font-medium mb-2">{q.question}</div>
                  <div className="text-sm space-y-1 ml-3 mb-2">
                    {q.options.map((opt, j) => (
                      <div
                        key={j}
                        className={
                          opt.isCorrect ? "text-green-600 font-medium" : ""
                        }
                      >
                        {String.fromCharCode(65 + j)}. {opt.text}{" "}
                        {opt.isCorrect && "✓"}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-600 italic">
                    {q.explanation?.substring(0, 150)}
                    {(q.explanation?.length || 0) > 150 ? "..." : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-md">{error}</div>
        )}

        {success && (
          <div className="p-4 bg-green-50 text-green-700 rounded-md">
            {success}
          </div>
        )}
      </div>
    </div>
  );
}

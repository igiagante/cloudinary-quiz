import React from "react";

interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  onReview: () => void;
}

export default function QuizProgress({
  currentQuestion,
  totalQuestions,
  onReview,
}: QuizProgressProps) {
  const progress = Math.round((currentQuestion / totalQuestions) * 100);

  return (
    <div className="w-full bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium">
          Question {currentQuestion} of {totalQuestions}
        </span>
        <button
          onClick={onReview}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Review All
        </button>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}

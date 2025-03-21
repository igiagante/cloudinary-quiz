// components/ImprovedQuizCard.tsx
import React, { useState } from "react";
import { QuizQuestion } from "@/types";

interface QuizCardProps {
  question: QuizQuestion;
  onAnswer: (questionId: string, answer: string) => void;
  showExplanation: boolean;
  userAnswer?: string;
}

export default function ImprovedQuizCard({
  question,
  onAnswer,
  showExplanation,
  userAnswer,
}: QuizCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(
    userAnswer || null
  );
  const isCorrect = userAnswer === question.correctAnswer;

  const handleOptionSelect = (option: string) => {
    if (userAnswer) return; // Prevent changing answer if already submitted

    setSelectedOption(option);
    onAnswer(question.id, option);
  };

  const getOptionClass = (option: string) => {
    if (!showExplanation || !selectedOption)
      return "border hover:border-gray-300";

    if (option === question.correctAnswer)
      return "border-2 border-green-500 bg-green-50";
    if (option === selectedOption && option !== question.correctAnswer)
      return "border-2 border-red-500 bg-red-50";
    return "border opacity-70";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-500">
          Topic: {question.topic}
        </span>
        <span className="text-sm text-gray-500 px-2 py-1 bg-gray-100 rounded">
          {question.difficulty.charAt(0).toUpperCase() +
            question.difficulty.slice(1)}
        </span>
      </div>

      <h3 className="text-lg font-semibold mb-4">{question.question}</h3>

      <div className="space-y-3">
        {question.options.map((option, index) => (
          <div
            key={index}
            className={`p-3 rounded-md cursor-pointer transition-all ${getOptionClass(
              option
            )}`}
            onClick={() => handleOptionSelect(option)}
          >
            <div className="flex items-start">
              <div
                className={`w-6 h-6 flex items-center justify-center rounded-full mr-2 ${
                  selectedOption === option
                    ? "bg-blue-500 text-white"
                    : "border border-gray-300"
                }`}
              >
                {String.fromCharCode(65 + index)}
              </div>
              <span>{option}</span>
            </div>
          </div>
        ))}
      </div>

      {showExplanation && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
          {isCorrect ? (
            <>
              <p className="font-medium text-sm text-green-600 mb-1">
                ✓ Correct Answer
              </p>
              <p className="text-sm text-gray-700">{question.explanation}</p>
            </>
          ) : (
            <>
              <p className="font-medium text-sm text-red-600 mb-1">
                ✗ Incorrect Answer
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <span className="font-medium">You selected:</span> {userAnswer}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <span className="font-medium">Correct answer:</span>{" "}
                {question.correctAnswer}
              </p>
              <p className="text-sm text-gray-700">{question.explanation}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import QuizCard from "@/components/quiz-card";
import { QuizQuestion } from "@/types";

interface ReviewPageProps {
  questions: QuizQuestion[];
  userAnswers: Record<string, string>;
  onNavigateBack: () => void;
  onFinishQuiz: () => void;
}

export default function ReviewPageContent({
  questions,
  userAnswers,
  onNavigateBack,
  onFinishQuiz,
}: ReviewPageProps) {
  const router = useRouter();

  const allQuestionsAnswered = questions.every((q) => userAnswers[q.id]);

  console.log(questions);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Review All Questions</h1>
        <button
          onClick={onNavigateBack}
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Quiz
        </button>
      </div>

      {questions.map((question, index) => (
        <div key={question.id} className="mb-8">
          <div className="text-sm text-gray-500 mb-1">Question {index + 1}</div>
          <QuizCard
            question={question}
            onAnswer={() => {}} // Read-only in review mode
            showExplanation={!!userAnswers[question.id]}
            userAnswer={userAnswers[question.id]}
          />
        </div>
      ))}

      <div className="flex justify-between mt-6">
        <button
          onClick={onNavigateBack}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded"
        >
          Back to Quiz
        </button>

        {allQuestionsAnswered && (
          <button
            onClick={onFinishQuiz}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded"
          >
            Finish Quiz and View Results
          </button>
        )}
      </div>
    </div>
  );
}

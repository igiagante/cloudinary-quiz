import React from "react";
import { QuizResults } from "@/types";

interface ResultsSummaryProps {
  results: QuizResults;
  onRetake: () => void;
}

export default function ResultsSummary({
  results,
  onRetake,
}: ResultsSummaryProps) {
  const { score, passed, topicBreakdown } = results;

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-center text-blue-700 mb-2">
        Quiz Results
      </h1>
      <p className="text-center text-lg text-gray-600 mb-8">
        See how well you did on the Cloudinary certification quiz
      </p>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-green-50 mb-6">
          {passed ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-green-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="8" r="7" />
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-red-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
        </div>

        <h2 className="text-2xl font-bold mb-2">
          {passed ? "Congratulations!" : "Not Passed"}
        </h2>

        <p className="text-xl mb-4">
          You scored{" "}
          <span className="font-bold">{score.percentage.toFixed(0)}%</span>
          {passed
            ? " and passed the certification quiz!"
            : " on the certification quiz."}
        </p>

        <div className="relative pt-1 mb-6">
          <div className="flex mb-2 items-center justify-between">
            <div className="text-left">
              <span className="text-xs font-semibold inline-block text-gray-600">
                0%
              </span>
            </div>
            <div className="text-center">
              <span className="text-xs font-semibold inline-block text-green-600">
                Passing (80%)
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-gray-600">
                100%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
            <div
              style={{ width: `${score.percentage}%` }}
              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                passed ? "bg-blue-500" : "bg-red-500"
              }`}
            ></div>
          </div>
        </div>

        <p className="text-gray-700 mb-6">
          {passed
            ? "You're well-prepared for the Cloudinary certification exam!"
            : "You need to score at least 80% to pass. Review the topics below and try again."}
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-blue-500 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="text-xl font-bold">Performance by Topic</h3>
        </div>

        <div className="space-y-4">
          {topicBreakdown.map((topic) => {
            const percentage = topic.percentage;
            const ratio = `${topic.correct}/${topic.total}`;
            const percentLabel = `${percentage.toFixed(0)}%`;

            return (
              <div key={topic.topic} className="mb-2">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{topic.topic}</span>
                  <span className="text-sm font-medium">
                    {ratio} ({percentLabel})
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      percentage === 100
                        ? "bg-green-500"
                        : percentage >= 80
                        ? "bg-blue-500"
                        : percentage >= 50
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {results.improvementAreas.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-blue-500 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-xl font-bold">Recommendations</h3>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              {results.improvementAreas.map((topic) => (
                <li key={topic}>
                  Review {topic} concepts in the Cloudinary documentation
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={onRetake}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-md"
        >
          Take Another Quiz
        </button>
      </div>
    </div>
  );
}

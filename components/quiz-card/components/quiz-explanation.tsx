import React from "react";
import SimpleMarkdown from "../utils/simple-markdown";
import CodeFormatter from "../utils/code-formatter";
import { QuizQuestion } from "@/types";
import { getOptionLetter } from "../utils/helpers";

interface QuizExplanationProps {
  question: QuizQuestion;
  userAnswer: string | string[] | undefined;
  isCorrect: boolean;
  isMultipleSelection: boolean;
  findOptionIndex: (optionText: string) => number;
  getCorrectAnswerLetters: () => string;
  correctAnswerLetter: string;
  userAnswerLetter: string;
  feedbackGiven?: boolean | null;
  feedbackValue?: boolean | null;
  onFeedback?: (isHelpful: boolean) => void;
}

const QuizExplanation: React.FC<QuizExplanationProps> = ({
  question,
  userAnswer,
  isCorrect,
  isMultipleSelection,
  findOptionIndex,
  getCorrectAnswerLetters,
  correctAnswerLetter,
  userAnswerLetter,
  feedbackGiven,
  feedbackValue,
  onFeedback,
}) => {
  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
      {isCorrect ? (
        <>
          <p className="font-medium text-sm text-green-600 mb-1">
            ✓ Correct Answer
          </p>
          <div className="text-sm text-gray-700">
            <SimpleMarkdown>{question.explanation}</SimpleMarkdown>
          </div>
        </>
      ) : (
        <>
          <p className="font-medium text-sm text-red-600 mb-1">
            ✗ Incorrect Answer
          </p>
          {isMultipleSelection ? (
            <>
              <p className="text-sm mb-2">
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-md font-medium">
                  You selected:{" "}
                  {Array.isArray(userAnswer) && userAnswer.length > 0
                    ? userAnswer
                        .map((ans) => {
                          const index = findOptionIndex(ans);
                          return `Option ${getOptionLetter(ans, index)}`;
                        })
                        .join(", ")
                    : "None"}
                </span>
              </p>
              <p className="text-sm mb-2">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md font-medium">
                  {Array.isArray(question.correctAnswers) &&
                  question.correctAnswers.length > 1
                    ? `Correct answers: ${getCorrectAnswerLetters()}`
                    : `Correct answer: Option ${correctAnswerLetter}`}
                </span>
              </p>
              <div className="w-full border-t border-gray-200 my-4"></div>
              <div className="flex flex-col space-y-2 mb-4">
                <p className="font-medium text-sm">Correct options:</p>
                {Array.isArray(question.correctAnswers) ? (
                  question.correctAnswers.map((answer, idx) => (
                    <div
                      key={idx}
                      className="border border-green-200 bg-green-50 p-2 rounded"
                    >
                      <CodeFormatter text={answer} />
                    </div>
                  ))
                ) : (
                  <div className="border border-green-200 bg-green-50 p-2 rounded">
                    <CodeFormatter text={question.correctAnswer} />
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm mb-2">
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-md font-medium">
                  You selected: Option {userAnswerLetter}
                </span>
              </p>
              <div className="mb-4">
                <CodeFormatter text={(userAnswer as string) || ""} />
              </div>
              <p className="text-sm mb-2">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md font-medium">
                  Correct answer: Option {correctAnswerLetter}
                </span>
              </p>
              <div className="mb-4">
                <CodeFormatter text={question.correctAnswer} />
              </div>
            </>
          )}
          <div className="w-full border-t border-gray-200 my-4"></div>
          <div className="text-sm text-gray-700 mt-4">
            <SimpleMarkdown>{question.explanation}</SimpleMarkdown>
          </div>
        </>
      )}

      {/* Question Feedback */}
      {onFeedback && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">
            Was this question helpful for your exam preparation?
          </p>
          <div className="flex space-x-3">
            <button
              className={`min-w-[130px] px-4 py-1.5 text-sm rounded-md border inline-flex items-center justify-center ${
                feedbackValue === true
                  ? "bg-green-100 border-green-300 text-green-700"
                  : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-green-50 hover:border-green-200 hover:text-green-700"
              }`}
              onClick={() => onFeedback(true)}
            >
              <span className="mr-2 text-xl">👍</span>
              Yes, helpful
            </button>
            <button
              className={`min-w-[130px] px-4 py-1.5 text-sm rounded-md border inline-flex items-center justify-center ${
                feedbackValue === false
                  ? "bg-red-100 border-red-300 text-red-700"
                  : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
              }`}
              onClick={() => onFeedback(false)}
            >
              <span className="mr-2 text-xl">👎</span>
              Not realistic
            </button>
          </div>
          {feedbackGiven && (
            <p className="text-sm text-gray-500 mt-2 italic">
              Thank you for your feedback!
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizExplanation;

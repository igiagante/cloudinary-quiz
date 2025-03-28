"use client";

import React, { useState, useEffect, useMemo } from "react";
import { QuizQuestion } from "@/types";
import SimpleMarkdown from "./utils/simple-markdown";
import SingleAnswerOption from "./components/simple-answer-option";
import MultipleAnswerOption from "./components/multiple-answer-option";
import QuizExplanation from "./components/quiz-explanation";
import {
  isMultipleSelectionQuestion,
  extractNumberFromSelectUp,
  getOptionLetter,
  checkIfAnswerIsCorrect,
} from "./utils/helpers";

// Import styles
import "./styles.css";

export interface QuizCardProps {
  question: QuizQuestion;
  onAnswer: (questionId: string, answer: string | string[]) => void;
  showExplanation: boolean;
  userAnswer?: string | string[];
  onFeedback?: (questionId: string, isHelpful: boolean) => void;
  showAnswerImmediately?: boolean;
  allowChangeAnswer?: boolean;
  onMultiAnswerSubmit?: (questionId: string) => void;
}

export default function QuizCard({
  question,
  onAnswer,
  showExplanation,
  userAnswer,
  onFeedback,
  showAnswerImmediately = false,
  allowChangeAnswer = true,
  onMultiAnswerSubmit,
}: QuizCardProps) {
  // Determine if this is a multiple selection question
  const [isMultipleSelection, setIsMultipleSelection] = useState<boolean>(
    () => {
      return isMultipleSelectionQuestion(question);
    }
  );

  // For single answer questions
  const [selectedOption, setSelectedOption] = useState<string | null>(
    Array.isArray(userAnswer) ? null : userAnswer || null
  );

  // For multiple answer questions
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    Array.isArray(userAnswer) ? userAnswer : userAnswer ? [userAnswer] : []
  );

  // Track feedback state
  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(false);
  const [feedbackValue, setFeedbackValue] = useState<boolean | null>(null);

  // Track submission state
  const [answerSubmitted, setAnswerSubmitted] = useState<boolean>(false);
  const [multipleAnswersSubmitted, setMultipleAnswersSubmitted] =
    useState<boolean>(false);

  // Update multiple selection state when question changes
  useEffect(() => {
    const shouldBeMultipleSelection = isMultipleSelectionQuestion(question);
    setIsMultipleSelection(shouldBeMultipleSelection);
  }, [question]);

  // Reset submission states when the question changes
  useEffect(() => {
    setAnswerSubmitted(false);
    setMultipleAnswersSubmitted(false);
  }, [question.id]);

  // Determine if the answer is correct
  const isCorrect = useMemo(() => {
    return checkIfAnswerIsCorrect(question, userAnswer, isMultipleSelection);
  }, [question, userAnswer, isMultipleSelection]);

  // Find the index of an option in the options array
  const findOptionIndex = (optionText: string): number => {
    return question.options.findIndex((opt) => opt === optionText);
  };

  // For single answer questions
  const userAnswerLetter =
    !Array.isArray(userAnswer) && userAnswer
      ? getOptionLetter(userAnswer, findOptionIndex(userAnswer))
      : "";

  const correctAnswerLetter = getOptionLetter(
    question.correctAnswer,
    findOptionIndex(question.correctAnswer)
  );

  // For multiple answer questions - get all correct answer letters
  const getCorrectAnswerLetters = () => {
    if (!question.hasMultipleCorrectAnswers || !question.correctAnswers) {
      return correctAnswerLetter;
    }

    return question.correctAnswers
      .map((answer) => {
        const index = findOptionIndex(answer);
        return getOptionLetter(answer, index);
      })
      .join(", ");
  };

  // Handle feedback submission
  const handleFeedback = (isHelpful: boolean) => {
    if (onFeedback) {
      onFeedback(question.id, isHelpful);
      setFeedbackGiven(true);
      setFeedbackValue(isHelpful);
    }
  };

  // Determine if we should show explanation based on settings and state
  const shouldShowExplanation =
    showExplanation ||
    (showAnswerImmediately &&
      ((isMultipleSelection && multipleAnswersSubmitted && answerSubmitted) || // For multiple-choice, ALWAYS require explicit submission
        (!isMultipleSelection && selectedOption !== null && answerSubmitted))); // For single-choice, need selection and implicit/explicit submission

  // Handle option selection
  const handleOptionSelect = (option: string) => {
    // Only allow changes if answer isn't submitted or changing is allowed
    if (userAnswer && !allowChangeAnswer) return;
    if (answerSubmitted && !allowChangeAnswer) return;

    if (isMultipleSelection) {
      // For multiple choice questions
      const newSelectedOptions = [...selectedOptions];

      if (newSelectedOptions.includes(option)) {
        // Remove if already selected
        const index = newSelectedOptions.indexOf(option);
        newSelectedOptions.splice(index, 1);
      } else {
        // Add if not selected
        newSelectedOptions.push(option);
      }

      setSelectedOptions(newSelectedOptions);
      onAnswer(question.id, newSelectedOptions);
    } else {
      // For single choice questions
      setSelectedOption(option);
      onAnswer(question.id, option);

      // If showing answer immediately, mark as submitted
      if (showAnswerImmediately) {
        setAnswerSubmitted(true);
      }
    }
  };

  // Handle submission of multiple answers
  const handleSubmitMultipleAnswers = () => {
    if (selectedOptions.length > 0) {
      setAnswerSubmitted(true);
      setMultipleAnswersSubmitted(true);

      // Call the parent's onMultiAnswerSubmit if provided
      if (onMultiAnswerSubmit) {
        onMultiAnswerSubmit(question.id);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 quiz-card">
      {/* Question Header */}
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-500">
          Topic: {question.topic}
        </span>
        <span className="text-sm text-gray-500 px-2 py-1 bg-gray-100 rounded">
          {question.difficulty.charAt(0).toUpperCase() +
            question.difficulty.slice(1)}
        </span>
      </div>

      {/* Multiple Selection Indicator */}
      {isMultipleSelection && (
        <div className="mb-3 px-3 py-2 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md text-sm">
          {(() => {
            const questionText = question.question.toLowerCase();
            const maxSelections = extractNumberFromSelectUp(questionText);

            if (maxSelections > 0) {
              return `Please select up to ${maxSelections} correct options`;
            } else if (
              Array.isArray(question.correctAnswers) &&
              question.correctAnswers.length > 1
            ) {
              return `Select ${question.correctAnswers.length} correct options`;
            } else {
              return "Select all appropriate correct options";
            }
          })()}
        </div>
      )}

      {/* Question Text */}
      <div className="text-lg font-semibold mb-4">
        <SimpleMarkdown>{question.question}</SimpleMarkdown>
      </div>

      {/* Question Options */}
      <div className="space-y-3">
        {question.options.map((option, index) =>
          isMultipleSelection ? (
            <MultipleAnswerOption
              key={index}
              option={option}
              index={index}
              isSelected={selectedOptions.includes(option)}
              isCorrect={
                shouldShowExplanation &&
                question.correctAnswers?.includes(option)
              }
              isIncorrect={
                shouldShowExplanation &&
                Array.isArray(userAnswer) &&
                userAnswer.includes(option) &&
                !question.correctAnswers?.includes(option)
              }
              showExplanation={shouldShowExplanation}
              handleSelect={handleOptionSelect}
            />
          ) : (
            <SingleAnswerOption
              key={index}
              option={option}
              index={index}
              isSelected={selectedOption === option}
              isCorrect={
                shouldShowExplanation && option === question.correctAnswer
              }
              isIncorrect={
                shouldShowExplanation &&
                option === selectedOption &&
                option !== question.correctAnswer
              }
              showExplanation={shouldShowExplanation}
              handleSelect={handleOptionSelect}
            />
          )
        )}
      </div>

      {/* Submit Button for Multiple Answer Questions */}
      {isMultipleSelection && selectedOptions.length > 0 && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="bg-yellow-50 p-3 rounded-md border border-yellow-300 mb-3">
            <p className="font-bold text-yellow-800">
              Multiple answer question detected
            </p>
            <p className="text-sm text-yellow-700">
              You must click the Submit button below to check your answers
            </p>
          </div>
          {!answerSubmitted ? (
            <>
              <button
                onClick={handleSubmitMultipleAnswers}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors w-full"
              >
                Submit Answers
              </button>
              <p className="text-xs text-gray-500 mt-1">
                You've selected {selectedOptions.length} option
                {selectedOptions.length !== 1 ? "s" : ""}. Click Submit when
                you're ready to check your answers.
              </p>
            </>
          ) : (
            <p className="text-xs text-green-600 font-semibold">
              Answers submitted
            </p>
          )}
        </div>
      )}

      {/* Explanation Section */}
      {shouldShowExplanation && (
        <QuizExplanation
          question={question}
          userAnswer={userAnswer}
          isCorrect={isCorrect}
          isMultipleSelection={isMultipleSelection}
          findOptionIndex={findOptionIndex}
          getCorrectAnswerLetters={getCorrectAnswerLetters}
          correctAnswerLetter={correctAnswerLetter}
          userAnswerLetter={userAnswerLetter}
          feedbackGiven={feedbackGiven}
          feedbackValue={feedbackValue}
          onFeedback={onFeedback ? handleFeedback : undefined}
        />
      )}
    </div>
  );
}

// components/quiz-card.tsx
"use client";

import React, { useState, useEffect } from "react";
import { QuizQuestion } from "@/types";

import dynamic from "next/dynamic";

// Dynamically import Highlight component with no SSR
const Highlight = dynamic(() => import("react-highlight"), { ssr: false });

interface QuizCardProps {
  question: QuizQuestion;
  onAnswer: (questionId: string, answer: string | string[]) => void;
  showExplanation: boolean;
  userAnswer?: string | string[];
  onFeedback?: (questionId: string, isHelpful: boolean) => void;
}

// Simple markdown text renderer
const SimpleMarkdown = ({ children }: { children: string }) => {
  // Check if text looks like it contains the triple backtick issue in explanations
  if (children.includes("```javascript") || children.includes("```js")) {
    // Process the markdown text directly without split/join
    const html = processMarkdownText(children);
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }

  // For text without code blocks or already fixed, process normally
  const html = processMarkdownText(children);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

// Separate function to handle basic markdown elements
const processMarkdownText = (text: string) => {
  // First, replace any triple backtick markdown code blocks (to avoid showing ```javascript tags)
  let processedText = text.replace(
    /```(?:javascript|js)?\n([\s\S]*?)```/g,
    (match, code) => {
      return `<div class="my-2 rounded-md overflow-hidden border border-gray-700 bg-[#1e1e1e] p-4">
      <pre class="text-white font-mono text-sm" style="margin: 0">
        <code>${code.trim()}</code>
      </pre>
    </div>`;
    }
  );

  return (
    processedText
      // Convert markdown links: [text](url)
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" class="text-blue-600 hover:underline" target="_blank">$1</a>'
      )
      // Convert bold: **text**
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      // Convert italic: *text*
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      // Handle inline code without treating all `text` as code
      // Only convert if it appears to be code (contains specific JavaScript patterns)
      .replace(/`([^`]+)`/g, (match, p1) => {
        const isLikelyCode =
          p1.includes(":") ||
          p1.includes("=") ||
          p1.includes("(") ||
          p1.includes(".") ||
          p1.includes("function") ||
          p1.includes("const");

        if (isLikelyCode) {
          return `<code class="bg-gray-800 text-gray-100 px-1 rounded text-sm font-mono">${p1}</code>`;
        } else {
          return `<code class="bg-gray-100 px-1 rounded text-sm font-mono">${p1}</code>`;
        }
      })
  );
};

function QuizCard({
  question,
  onAnswer,
  showExplanation,
  userAnswer,
  onFeedback,
}: QuizCardProps) {
  // For single answer questions
  const [selectedOption, setSelectedOption] = useState<string | null>(
    Array.isArray(userAnswer) ? null : userAnswer || null
  );

  // For multiple answer questions
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    Array.isArray(userAnswer) ? userAnswer : userAnswer ? [userAnswer] : []
  );

  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(false);
  const [feedbackValue, setFeedbackValue] = useState<boolean | null>(null);

  // Determine if the answer is correct - handles both single and multiple answers
  const isCorrect = question.hasMultipleCorrectAnswers
    ? Array.isArray(userAnswer) &&
      Array.isArray(question.correctAnswers) &&
      question.correctAnswers.length === userAnswer.length &&
      question.correctAnswers.every((a) => userAnswer.includes(a))
    : userAnswer === question.correctAnswer;

  // Get option letter (A, B, C, D) from the option text or index
  const getOptionLetter = (option: string, index: number): string => {
    const letterMatch = option.match(/^([A-D])\)/);
    if (letterMatch) {
      return letterMatch[1];
    }
    return String.fromCharCode(65 + index);
  };

  // Find the index of the selected and correct options to get their letters
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

  // Apply styling on component mount
  useEffect(() => {
    // Add custom syntax highlighting styles
    const style = document.createElement("style");
    style.id = "quiz-code-styles";
    style.textContent = `
      .quiz-card pre {
        margin: 0;
        width: 100%;
      }
      
      .quiz-card pre code {
        display: block;
        white-space: pre-wrap;
        word-break: break-word;
        padding: 0.5rem;
        font-size: 0.875rem;
      }
      
      .quiz-card .code-block {
        background-color: #1e1e1e;
        color: #d4d4d4;
        border: 1px solid #333;
        border-radius: 4px;
        margin-bottom: 0.5rem;
      }
      
      /* Custom syntax highlighting colors */
      .quiz-card .keyword {
        color: #569cd6;
      }
      
      .quiz-card .string {
        color: #ce9178;
      }
      
      .quiz-card .number {
        color: #b5cea8;
      }
      
      .quiz-card .property {
        color: #9cdcfe;
      }
    `;

    // Remove existing style if it exists
    const existingStyle = document.getElementById("quiz-code-styles");
    if (existingStyle) {
      existingStyle.remove();
    }

    document.head.appendChild(style);

    // Clean up on unmount
    return () => {
      const styleToRemove = document.getElementById("quiz-code-styles");
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, []);

  const handleOptionSelect = (option: string) => {
    if (userAnswer) return; // Prevent changing answer if already submitted

    if (question.hasMultipleCorrectAnswers) {
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
    }
  };

  const handleFeedback = (isHelpful: boolean) => {
    if (onFeedback) {
      onFeedback(question.id, isHelpful);
      setFeedbackGiven(true);
      setFeedbackValue(isHelpful);
    }
  };

  const getOptionClass = (option: string) => {
    if (!showExplanation) {
      // Before submission
      if (question.hasMultipleCorrectAnswers) {
        return selectedOptions.includes(option)
          ? "border-2 border-blue-500 bg-blue-50"
          : "border hover:border-gray-300";
      } else {
        return selectedOption === option
          ? "border-2 border-blue-500 bg-blue-50"
          : "border hover:border-gray-300";
      }
    }

    // After submission
    if (question.hasMultipleCorrectAnswers && question.correctAnswers) {
      if (question.correctAnswers.includes(option)) {
        return "border-2 border-green-500 bg-green-50"; // Correct answer
      }
      if (
        Array.isArray(userAnswer) &&
        userAnswer.includes(option) &&
        !question.correctAnswers.includes(option)
      ) {
        return "border-2 border-red-500 bg-red-50"; // Incorrect selection
      }
    } else {
      if (option === question.correctAnswer) {
        return "border-2 border-green-500 bg-green-50"; // Correct answer
      }
      if (option === selectedOption && option !== question.correctAnswer) {
        return "border-2 border-red-500 bg-red-50"; // Incorrect selection
      }
    }

    return "border opacity-70"; // Unselected option
  };

  const getOptionLetterClass = (option: string) => {
    // For the letter circle
    if (!showExplanation) {
      if (question.hasMultipleCorrectAnswers) {
        return selectedOptions.includes(option)
          ? "bg-blue-500 text-white"
          : "border border-gray-300";
      } else {
        return selectedOption === option
          ? "bg-blue-500 text-white"
          : "border border-gray-300";
      }
    }

    // After submission, color code based on correctness
    if (question.hasMultipleCorrectAnswers && question.correctAnswers) {
      if (question.correctAnswers.includes(option)) {
        return "bg-green-500 text-white border-0"; // Correct answer
      }
      if (
        Array.isArray(userAnswer) &&
        userAnswer.includes(option) &&
        !question.correctAnswers.includes(option)
      ) {
        return "bg-red-500 text-white border-0"; // Incorrect selection
      }
    } else {
      if (option === question.correctAnswer) {
        return "bg-green-500 text-white border-0"; // Correct answer
      }
      if (option === selectedOption && option !== question.correctAnswer) {
        return "bg-red-500 text-white border-0"; // Incorrect selection
      }
    }

    // Other options after submission
    return "border border-gray-300 opacity-70";
  };

  // Extract option letter (A-D) if present at the beginning of the option text
  const formatCodeForDisplay = (text: string) => {
    // If the option starts with A), B), C), etc., extract the letter
    const letterMatch = text.match(/^([A-D]\))\s*(.*)/);
    if (letterMatch) {
      return {
        optionLetter: letterMatch[1],
        code: letterMatch[2],
      };
    }
    return {
      optionLetter: "",
      code: text,
    };
  };

  // Format code option for display
  const formatCode = (text: string) => {
    const { optionLetter, code } = formatCodeForDisplay(text);

    // More precise detection for JavaScript code that needs highlighting
    const isCodeSnippet =
      (code.includes("cloudinary.url") ||
        code.includes("cl_video_tag") ||
        code.includes("cl.") ||
        (code.includes("const") && code.includes("=")) ||
        (code.includes("transformation:") && code.includes("[")) ||
        (code.includes("quality:") && code.includes("format:")) ||
        (code.includes("fetch_format:") && code.includes("'auto'"))) &&
      code.length > 15; // Must be substantial enough to be code

    // If it's not code, return as regular text
    if (!isCodeSnippet) {
      return <SimpleMarkdown>{text}</SimpleMarkdown>;
    }

    // Format the code with proper indentation and line breaks
    let formattedCode = code;

    // Add line breaks after opening braces and before closing braces for better readability
    formattedCode = formattedCode
      .replace(/\{/g, "{\n  ")
      .replace(/,\s*(?=\S)/g, ",\n  ")
      .replace(/\}/g, "\n}")
      .replace(/\[\s*\n/g, "[\n  ")
      .replace(/\n\s*\]/g, "\n]");

    // Apply simple syntax highlighting manually for consistent results
    const highlightedCode = formattedCode
      // Highlight keywords
      .replace(
        /\b(const|let|var|function|return|if|else|for|while|async|await)\b/g,
        '<span class="keyword">$1</span>'
      )
      // Highlight strings
      .replace(
        /'([^'\\]*(\\.[^'\\]*)*)'|"([^"\\]*(\\.[^"\\]*)*)"/g,
        '<span class="string">$&</span>'
      )
      // Highlight numbers
      .replace(/\b(\d+(\.\d+)?)\b/g, '<span class="number">$&</span>')
      // Highlight properties in objects
      .replace(/(\w+)(?=\s*:)/g, '<span class="property">$&</span>');

    // For code content, use a simple pre/code block with proper styling
    return (
      <div className="w-full">
        <div className="rounded-md overflow-hidden border border-gray-700 bg-[#1e1e1e] p-4 code-block">
          <pre className="text-white font-mono text-sm" style={{ margin: 0 }}>
            <code dangerouslySetInnerHTML={{ __html: highlightedCode }}></code>
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 quiz-card">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-500">
          Topic: {question.topic}
        </span>
        <span className="text-sm text-gray-500 px-2 py-1 bg-gray-100 rounded">
          {question.difficulty.charAt(0).toUpperCase() +
            question.difficulty.slice(1)}
        </span>
      </div>

      {question.hasMultipleCorrectAnswers && (
        <div className="mb-3 px-3 py-2 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md text-sm">
          This question has multiple correct answers. Select all that apply.
        </div>
      )}

      <div className="text-lg font-semibold mb-4">
        <SimpleMarkdown>{question.question}</SimpleMarkdown>
      </div>

      <div className="space-y-3">
        {question.options.map((option, index) => (
          <div
            key={index}
            className={`p-3 rounded-md cursor-pointer transition-all quiz-option ${getOptionClass(
              option
            )}`}
            onClick={() => handleOptionSelect(option)}
          >
            <div className="flex items-start">
              {question.hasMultipleCorrectAnswers ? (
                // Checkbox UI for multiple answer questions
                <div className="relative flex items-center justify-center mr-2">
                  <div
                    className={`w-5 h-5 border ${
                      selectedOptions.includes(option)
                        ? "bg-blue-500 border-blue-500"
                        : "border-gray-300"
                    } rounded flex items-center justify-center`}
                  >
                    {selectedOptions.includes(option) && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5 text-white"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="absolute ml-7">
                    {String.fromCharCode(65 + index)})
                  </span>
                </div>
              ) : (
                // Circle UI for single answer questions
                <div
                  className={`w-6 h-6 flex items-center justify-center rounded-full mr-2 ${
                    selectedOption === option
                      ? "bg-blue-500 text-white"
                      : "border border-gray-300"
                  }`}
                >
                  {String.fromCharCode(65 + index)}
                </div>
              )}
              <div className="ml-6 w-full">{formatCode(option)}</div>
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
              <div className="text-sm text-gray-700">
                <SimpleMarkdown>{question.explanation}</SimpleMarkdown>
              </div>
            </>
          ) : (
            <>
              <p className="font-medium text-sm text-red-600 mb-1">
                ✗ Incorrect Answer
              </p>
              {question.hasMultipleCorrectAnswers ? (
                <>
                  <p className="text-sm mb-2">
                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-md font-medium">
                      You selected:{" "}
                      {Array.isArray(userAnswer)
                        ? userAnswer
                            .map((ans, i) => {
                              const index = findOptionIndex(ans);
                              return `Option ${getOptionLetter(ans, index)}`;
                            })
                            .join(", ")
                        : "None"}
                    </span>
                  </p>
                  <p className="text-sm mb-2">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md font-medium">
                      Correct answers: {getCorrectAnswerLetters()}
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm mb-2">
                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-md font-medium">
                      You selected: Option {userAnswerLetter}
                    </span>
                  </p>
                  <div className="mb-4">
                    {formatCode((userAnswer as string) || "")}
                  </div>
                  <p className="text-sm mb-2">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md font-medium">
                      Correct answer: Option {correctAnswerLetter}
                    </span>
                  </p>
                  <div className="mb-4">
                    {formatCode(question.correctAnswer)}
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
                  onClick={() => handleFeedback(true)}
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
                  onClick={() => handleFeedback(false)}
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
      )}
    </div>
  );
}

export default QuizCard;

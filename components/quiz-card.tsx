"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  showAnswerImmediately?: boolean;
  allowChangeAnswer?: boolean;
  onMultiAnswerSubmit?: (questionId: string) => void;
}

// Simple markdown text renderer
const SimpleMarkdown = ({ children }: { children: string }) => {
  // Add safety check for non-string children
  if (typeof children !== "string") {
    return <div>{String(children || "")}</div>;
  }

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
  // First, add type safety check to handle non-string inputs
  if (typeof text !== "string") {
    return String(text || ""); // Convert non-string to string or empty string if null/undefined
  }

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
  showAnswerImmediately = false,
  allowChangeAnswer = true,
  onMultiAnswerSubmit,
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

  // Add state to track if the user has "submitted" their answer locally
  const [answerSubmitted, setAnswerSubmitted] = useState<boolean>(false);

  // Add state to track if we should treat this as a multiple selection question
  const [isMultipleSelection, setIsMultipleSelection] = useState(() => {
    // More precise check for multiple-choice questions
    const questionText = question.question.toLowerCase();

    // Only look for specific phrases that clearly indicate multiple answers
    const explicitMultipleIndicators = [
      "select all that apply",
      "select all applicable",
      "select up to",
      "(select all",
      "select 2",
      "select two",
      "select multiple",
    ];

    const hasExplicitIndicator = explicitMultipleIndicators.some((phrase) =>
      questionText.includes(phrase)
    );

    const hasMultipleIndicator =
      question.hasMultipleCorrectAnswers === true ||
      (Array.isArray(question.correctAnswers) &&
        question.correctAnswers.length > 1) ||
      hasExplicitIndicator;

    console.log("Initial multiple-selection check:", {
      questionId: question.id,
      questionText: question.question.substring(0, 50),
      hasExplicitIndicator,
      hasMultipleIndicator,
      result: hasMultipleIndicator,
    });

    return hasMultipleIndicator;
  });

  // Add a new state for tracking when multiple answers are ready to submit
  const [multipleAnswersSubmitted, setMultipleAnswersSubmitted] =
    useState<boolean>(false);

  // Determine if this is a multiple-selection question based on the question text and data structure
  useEffect(() => {
    // Check if the question text contains specific indicators of multiple choices
    const questionText = question.question.toLowerCase();

    // Define explicit phrases that clearly indicate multiple answers
    const explicitMultipleIndicators = [
      "select all that apply",
      "select all applicable",
      "select up to",
      "(select all",
      "select 2",
      "select two",
      "select multiple",
    ];

    const textIndicatesMultipleSelection = explicitMultipleIndicators.some(
      (phrase) => questionText.includes(phrase)
    );

    // Only treat as multiple selection if either:
    // 1. Question data has hasMultipleCorrectAnswers=true, OR
    // 2. Question data has correctAnswers array with multiple items, OR
    // 3. Question text explicitly indicates multiple selections with specific phrases
    const dataIndicatesMultipleAnswers =
      question.hasMultipleCorrectAnswers === true ||
      (Array.isArray(question.correctAnswers) &&
        (question.correctAnswers?.length || 0) > 1);

    // Enhanced debug logging
    console.log("Question data inspection:", {
      id: question.id,
      hasMultipleCorrectAnswers: question.hasMultipleCorrectAnswers,
      correctAnswers: question.correctAnswers,
      correctAnswersIsArray: Array.isArray(question.correctAnswers),
      correctAnswersLength: Array.isArray(question.correctAnswers)
        ? question.correctAnswers.length
        : 0,
      textIndicatesMultiple: textIndicatesMultipleSelection,
      dataIndicatesMultiple: dataIndicatesMultipleAnswers,
    });

    // Set as multiple selection if EITHER data OR explicit text indicates it
    const shouldBeMultipleSelection =
      dataIndicatesMultipleAnswers || textIndicatesMultipleSelection;

    console.log(
      `Setting isMultipleSelection to ${shouldBeMultipleSelection} for question ID ${question.id}`
    );
    setIsMultipleSelection(shouldBeMultipleSelection);
  }, [question]);

  // For questions where text suggests multiple answers but correctAnswers is empty
  const extractNumberFromSelectUp = (text: string): number => {
    const match = text.match(/select up to (\d+)/i);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return 0;
  };

  // Determine if the answer is correct - handles both single and multiple answers
  // Improved logic for multiple-answer questions
  const isCorrect = useMemo(() => {
    console.log("DEBUG - Answer validation:", {
      questionId: question.id,
      userAnswer,
      correctAnswer: question.correctAnswer,
      correctAnswers: question.correctAnswers,
      options: question.options,
      hasMultipleCorrectAnswers: question.hasMultipleCorrectAnswers,
    });

    // CRITICAL FIX: If there's no correctAnswer or correctAnswers defined
    // This is a data error that needs to be handled gracefully
    if (
      !question.correctAnswer &&
      (!question.correctAnswers || !question.correctAnswers.length)
    ) {
      console.error(`Question ${question.id} has no correct answer defined!`);

      // FALLBACK: For questions with no correct answer defined, accept any answer as correct
      // This prevents a broken user experience where all answers would be marked wrong
      if (userAnswer) {
        return true;
      }
      return false;
    }

    // Rest of the validation logic continues...
    // Check for text-based multiple answer questions with incomplete data
    const questionText = question.question.toLowerCase();
    const hasSelectUpToText = questionText.includes("select up to");
    const maxSelections = extractNumberFromSelectUp(questionText);

    // Special case: Text indicates multiple selections but data structure doesn't
    if (
      isMultipleSelection &&
      (!question.hasMultipleCorrectAnswers ||
        !Array.isArray(question.correctAnswers) ||
        question.correctAnswers.length === 0)
    ) {
      // If we have a "select up to X" pattern, user should be allowed to select up to X options
      // In this case, we don't know which answers are correct, so we'll just check they didn't select too many
      if (hasSelectUpToText && maxSelections > 0) {
        return (
          Array.isArray(userAnswer) &&
          userAnswer.length > 0 &&
          userAnswer.length <= maxSelections
        );
      }

      // For other multiple selection questions without data, any selection is considered valid
      // (this is a fallback for improperly formatted questions)
      return Array.isArray(userAnswer) && userAnswer.length > 0;
    }

    if (question.hasMultipleCorrectAnswers === true) {
      // Make sure userAnswer is an array and correctAnswers exists
      if (
        !Array.isArray(userAnswer) ||
        !Array.isArray(question.correctAnswers)
      ) {
        console.warn("Invalid data structure for multiple-answer question", {
          userAnswer,
          correctAnswers: question.correctAnswers,
        });
        return false;
      }

      // For "select all that apply" questions, we need exact matching
      return (
        userAnswer.length === question.correctAnswers.length &&
        question.correctAnswers.every((a) => userAnswer.includes(a))
      );
    } else if (
      Array.isArray(question.correctAnswers) &&
      (question.correctAnswers?.length || 0) > 0
    ) {
      // For questions with correctAnswers array but not explicitly marked as multiple-answer
      if (!Array.isArray(userAnswer)) {
        // Check if the single userAnswer matches the correctAnswer or is in correctAnswers
        return (
          userAnswer === question.correctAnswer ||
          (Array.isArray(question.correctAnswers) &&
            question.correctAnswers.some((answer) => answer === userAnswer))
        );
      }

      // If question text suggests "select up to X" but data has only one correct answer
      if (userAnswer.length === 1) {
        return (
          (question.correctAnswers || []).includes(userAnswer[0]) ||
          userAnswer[0] === question.correctAnswer
        );
      } else if (userAnswer.length > 1) {
        // If user selected multiple answers, check against correctAnswers
        const answers = question.correctAnswers || [];
        return (
          userAnswer.length <= answers.length &&
          userAnswer.every((ans) => answers.includes(ans))
        );
      }

      return false;
    }

    // For standard single-answer questions
    // First, try exact match
    if (userAnswer === question.correctAnswer) {
      return true;
    }

    // If that fails, check if userAnswer exists in the options and matches the correct answer
    // This handles cases where the correct answer might have formatting differences
    const userOptionIndex =
      typeof userAnswer === "string"
        ? question.options.findIndex((opt) => opt === userAnswer)
        : -1;
    const correctOptionIndex = question.correctAnswer
      ? question.options.findIndex((opt) => opt === question.correctAnswer)
      : -1;

    if (userOptionIndex !== -1 && correctOptionIndex !== -1) {
      return userOptionIndex === correctOptionIndex;
    }

    return false;
  }, [question, userAnswer, isMultipleSelection]);

  // Add debug logging for multiple answer questions
  useEffect(() => {
    if (isMultipleSelection || question.hasMultipleCorrectAnswers) {
      console.log("Multiple Answer Question Detected:", {
        id: question.id,
        question: question.question,
        hasMultipleCorrectAnswers: question.hasMultipleCorrectAnswers,
        isMultipleSelection,
        correctAnswer: question.correctAnswer,
        correctAnswers: question.correctAnswers,
        userAnswer,
        isCorrect,
        selectedOptions,
        answerSubmitted,
        multipleAnswersSubmitted,
        shouldRenderSubmitButton:
          isMultipleSelection && selectedOptions.length > 0,
      });
    }
  }, [
    isMultipleSelection,
    question,
    userAnswer,
    isCorrect,
    selectedOptions,
    answerSubmitted,
    multipleAnswersSubmitted,
  ]);

  // Reset submission states when the question changes
  useEffect(() => {
    setAnswerSubmitted(false);
    setMultipleAnswersSubmitted(false);
    console.log("Question changed, reset submission states", {
      questionId: question.id,
      questionText: question.question.substring(0, 40),
      isMultipleSelection,
      hasMultipleCorrectAnswers: question.hasMultipleCorrectAnswers,
      selectedOptionsCount: selectedOptions.length,
    });
  }, [question.id]);

  // Get option letter (A, B, C, D) from the option text or index
  const getOptionLetter = (option: string, index: number): string => {
    // Add null check to prevent "Cannot read properties of undefined (reading 'match')" error
    if (!option) {
      return String.fromCharCode(65 + index);
    }

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

  // Debug output right before rendering
  useEffect(() => {
    console.log("DEBUG RENDER STATE:", {
      id: question.id,
      questionShort: question.question.substring(0, 40),
      isMultipleSelection,
      hasMultipleCorrectAnswers: question.hasMultipleCorrectAnswers,
      selectedOptionsCount: selectedOptions.length,
      shouldShowSubmitButton: isMultipleSelection && selectedOptions.length > 0,
      answerSubmitted,
      shouldShowExplanation,
    });
  }, [
    question,
    selectedOptions,
    isMultipleSelection,
    answerSubmitted,
    shouldShowExplanation,
  ]);

  // Apply styling on component mount
  useEffect(() => {
    // Add custom code block styles with syntax highlighting
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
        width: 100%;
        min-width: 300px;
      }

      /* Make all code blocks use consistent spacing */
      .hljs {
        display: block !important;
        overflow-x: auto !important;
        padding: 1rem !important; 
        background: #1e1e1e !important;
        color: #d4d4d4 !important;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
        font-size: 14px !important;
        line-height: 1.6 !important;
        border-radius: 0.375rem !important;
        margin-top: 0.5rem !important;
        white-space: pre !important;
      }
      
      /* Syntax highlighting colors */
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

      /* Special strings for different code elements */
      .quiz-card pre code .cloudinary { color: #569cd6; }
      .quiz-card pre code .url { color: #9cdcfe; }
      .quiz-card pre code .effect { color: #9cdcfe; }
      .quiz-card pre code .radius { color: #9cdcfe; }
      .quiz-card pre code .border { color: #9cdcfe; }
      .quiz-card pre code .str { color: #ce9178; }
      .quiz-card pre code .num { color: #b5cea8; }
      .quiz-card pre code .object { color: #4ec9b0; }
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

  // Update the handleOptionSelect function to handle both cases
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

      // NEVER automatically submit multiple-answer questions, regardless of showAnswerImmediately value
      // This forces users to use the Submit button
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

  // Add new function to handle submission of multiple answers
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

  const getOptionClass = (option: string) => {
    if (!shouldShowExplanation) {
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
      // For multiple answer questions, only show correct/incorrect after Submit button is clicked
      if (!answerSubmitted) {
        return selectedOptions.includes(option)
          ? "border-2 border-blue-500 bg-blue-50"
          : "border hover:border-gray-300";
      }

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
    if (!shouldShowExplanation) {
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
      // For multiple answer questions, only show correct/incorrect after Submit button is clicked
      if (!answerSubmitted) {
        return selectedOptions.includes(option)
          ? "bg-blue-500 text-white"
          : "border border-gray-300";
      }

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
    // Check if text is a string before calling match
    if (typeof text !== "string") {
      return {
        optionLetter: "",
        code: String(text || ""), // Convert non-string to string or empty string if null/undefined
      };
    }

    // Now safely use match on the string
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
    if (typeof text !== "string") {
      return <span>{String(text || "")}</span>;
    }

    const { optionLetter, code } = formatCodeForDisplay(text);

    // Clean up any markdown formatting decorators and normalize whitespace
    let cleanedCode = code
      .replace(/```(?:javascript|js|typescript|ts)?|```/g, "") // Remove markdown code block markers
      .replace(/^\s+|\s+$/gm, "") // Remove leading/trailing whitespace from each line
      .replace(/\n{2,}/g, "\n") // Replace multiple newlines with single newlines
      .replace(/[ \t]+$/gm, "") // Remove trailing spaces/tabs from each line
      .trim();

    // Check if this is the specific problematic format showing HTML tags
    const containsHtmlTags =
      cleanedCode.includes('"keyword">') ||
      cleanedCode.includes('"property">') ||
      cleanedCode.includes('"string">');

    if (containsHtmlTags) {
      const cleanText = cleanedCode
        .replace(/"keyword">/g, "")
        .replace(/"property">/g, "")
        .replace(/"string">/g, "")
        .replace(/"number">/g, "")
        .trim();

      return (
        <div className="w-full">
          <div className="rounded-md overflow-hidden border border-gray-700 bg-[#1e1e1e] code-block">
            <pre className="text-white font-mono text-sm whitespace-pre m-0 p-3">
              <code className="block">{cleanText}</code>
            </pre>
          </div>
        </div>
      );
    }

    // More precise detection for JavaScript code that needs displaying as code
    const isCodeSnippet =
      (cleanedCode.includes("cloudinary") ||
        cleanedCode.includes("cl_video_tag") ||
        cleanedCode.includes("cl.") ||
        cleanedCode.includes(".url(") ||
        cleanedCode.includes(".effect(") ||
        cleanedCode.includes(".radius(") ||
        cleanedCode.includes(".border(") ||
        cleanedCode.includes(".image(") ||
        (cleanedCode.includes("const") && cleanedCode.includes("=")) ||
        (cleanedCode.includes("transformation:") &&
          cleanedCode.includes("[")) ||
        (cleanedCode.includes("quality:") && cleanedCode.includes("format:")) ||
        (cleanedCode.includes("fetch_format:") &&
          cleanedCode.includes("'auto'"))) &&
      cleanedCode.length > 10;

    if (!isCodeSnippet) {
      return <SimpleMarkdown>{text}</SimpleMarkdown>;
    }

    // Apply syntax highlighting directly with React JSX
    const highlightSyntax = (code: string) => {
      let highlightedCode = code
        .split("\n")
        .map((line) => line.trim()) // Trim each line
        .join("\n"); // Rejoin with single newlines

      // Replace strings with spans (must be done first to avoid conflicts)
      highlightedCode = highlightedCode
        .replace(/"([^"]*)"/g, '<span class="str">"$1"</span>')
        .replace(/'([^']*)'/g, "<span class=\"str\">'$1'</span>");

      // Replace specific keywords
      highlightedCode = highlightedCode
        .replace(
          /\bcloudinary\b/g,
          '<span class="cloudinary">cloudinary</span>'
        )
        .replace(/\.url\b/g, '.<span class="url">url</span>')
        .replace(/\.effect\b/g, '.<span class="effect">effect</span>')
        .replace(/\.radius\b/g, '.<span class="radius">radius</span>')
        .replace(/\.border\b/g, '.<span class="border">border</span>')
        .replace(/\.image\b/g, '.<span class="border">image</span>')
        .replace(
          /\b(const|let|var|function|return|if|else)\b/g,
          '<span class="keyword">$1</span>'
        )
        .replace(/\b(\d+)\b/g, '<span class="num">$1</span>')
        .replace(
          /\b(transformation|effect|radius|border)\b:/g,
          '<span class="property">$1</span>:'
        );

      return highlightedCode;
    };

    return (
      <div className="w-full">
        <div className="rounded-md overflow-hidden border border-gray-700 bg-[#1e1e1e] code-block">
          <pre className="text-white font-mono text-sm whitespace-pre m-0 p-3">
            <code
              className="block"
              dangerouslySetInnerHTML={{ __html: highlightSyntax(cleanedCode) }}
            />
          </pre>
        </div>
      </div>
    );
  };

  // Add custom styles to quiz-card options and layout
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "quiz-option-styles";
    style.textContent = `
      /* Fix quiz option layout */
      .quiz-option {
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        display: block !important;
        width: 100% !important;
      }
      
      .quiz-option > div {
        width: 100% !important;
        display: flex !important;
        align-items: flex-start !important;
      }
      
      /* Remove any unwanted spaces in code blocks */
      .code-block {
        width: 100% !important;
        display: block !important;
        min-width: 0 !important;
        max-width: 100% !important;
        overflow: hidden !important;
      }
      
      .quiz-card pre {
        margin: 0 !important;
        padding: 0.75rem !important;
        width: 100% !important;
        overflow-x: auto !important;
        display: block !important;
        line-height: 1.4 !important;
      }
      
      .quiz-card pre code {
        display: block !important;
        white-space: pre !important;
        min-width: 0 !important;
        max-width: 100% !important;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
        line-height: 1.4 !important;
        padding: 0 !important;
      }

      /* Ensure no extra space between lines */
      .quiz-card pre code span {
        display: inline !important;
        white-space: pre !important;
        line-height: inherit !important;
      }

      /* Fix code block spacing */
      .quiz-card .code-block pre {
        margin: 0 !important;
        padding: 0.75rem !important;
      }

      .quiz-card .code-block pre code {
        margin: 0 !important;
        padding: 0 !important;
      }
    `;

    // Remove existing style if it exists
    const existingStyle = document.getElementById("quiz-option-styles");
    if (existingStyle) {
      existingStyle.remove();
    }

    document.head.appendChild(style);

    // Clean up on unmount
    return () => {
      const styleToRemove = document.getElementById("quiz-option-styles");
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, []);

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

      {/* Update the display of selection type indicator */}
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
            <div className="flex items-start w-full">
              {isMultipleSelection ? (
                // Checkbox UI for multiple answer questions - complete redesign for better alignment
                <div className="flex items-start w-full">
                  {/* Checkbox separated from the letter */}
                  <div className="flex-shrink-0 mt-1">
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
                  </div>

                  {/* Letter in its own container */}
                  <div className="flex-shrink-0 w-6 text-center ml-2">
                    {String.fromCharCode(65 + index)})
                  </div>

                  {/* Text content properly separated - ensure this takes full width */}
                  <div className="flex-1 min-w-0 ml-2">
                    {formatCode(option)}
                  </div>
                </div>
              ) : (
                // Circle UI for single answer questions
                <div className="flex items-start w-full">
                  <div
                    className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full mt-1 ${getOptionLetterClass(
                      option
                    )}`}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>

                  <div className="flex-1 min-w-0 ml-3">
                    {formatCode(option)}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ONLY show submit button for CONFIRMED multiple selection questions once an option is selected */}
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

      {shouldShowExplanation && (
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
                          {formatCode(answer)}
                        </div>
                      ))
                    ) : (
                      <div className="border border-green-200 bg-green-50 p-2 rounded">
                        {formatCode(question.correctAnswer)}
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

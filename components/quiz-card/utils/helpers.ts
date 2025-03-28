import { QuizQuestion } from "@/types";

/**
 * Determine if a question requires multiple answer selection based on content and metadata
 */
export const isMultipleSelectionQuestion = (
  question: QuizQuestion
): boolean => {
  // Check for explicit indicators in question text
  const questionText = question.question.toLowerCase();

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

  // Check question metadata
  const hasMultipleIndicator =
    question.hasMultipleCorrectAnswers === true ||
    (Array.isArray(question.correctAnswers) &&
      question.correctAnswers.length > 1) ||
    hasExplicitIndicator;

  return hasMultipleIndicator;
};

/**
 * For questions with "select up to X" patterns
 */
export const extractNumberFromSelectUp = (text: string): number => {
  const match = text.match(/select up to (\d+)/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return 0;
};

/**
 * Get option letter (A, B, C, D) from the option text or index
 */
export const getOptionLetter = (option: string, index: number): string => {
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

/**
 * Check if a user's answer is correct
 */
export const checkIfAnswerIsCorrect = (
  question: QuizQuestion,
  userAnswer: string | string[] | undefined,
  isMultipleSelection: boolean
): boolean => {
  // If there's no correctAnswer or correctAnswers defined
  if (
    !question.correctAnswer &&
    (!question.correctAnswers || !question.correctAnswers.length)
  ) {
    // For questions with no correct answer defined, accept any answer as correct
    if (userAnswer) {
      return true;
    }
    return false;
  }

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
    // For "select up to X" pattern, check they didn't select too many
    if (hasSelectUpToText && maxSelections > 0) {
      return (
        Array.isArray(userAnswer) &&
        userAnswer.length > 0 &&
        userAnswer.length <= maxSelections
      );
    }

    // For other multiple selection questions without data, any selection is considered valid
    return Array.isArray(userAnswer) && userAnswer.length > 0;
  }

  if (question.hasMultipleCorrectAnswers === true) {
    // Make sure userAnswer is an array and correctAnswers exists
    if (!Array.isArray(userAnswer) || !Array.isArray(question.correctAnswers)) {
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
      // Check single userAnswer against correctAnswer or correctAnswers
      return (
        userAnswer === question.correctAnswer ||
        (Array.isArray(question.correctAnswers) &&
          question.correctAnswers.some((answer) => answer === userAnswer))
      );
    }

    // If user selected multiple answers, check against correctAnswers
    if (userAnswer.length === 1) {
      return (
        (question.correctAnswers || []).includes(userAnswer[0]) ||
        userAnswer[0] === question.correctAnswer
      );
    } else if (userAnswer.length > 1) {
      const answers = question.correctAnswers || [];
      return (
        userAnswer.length <= answers.length &&
        userAnswer.every((ans) => answers.includes(ans))
      );
    }

    return false;
  }

  // For standard single-answer questions - try exact match
  if (userAnswer === question.correctAnswer) {
    return true;
  }

  // If that fails, check if userAnswer exists in the options and matches by index
  if (typeof userAnswer === "string") {
    const userOptionIndex = question.options.findIndex(
      (opt) => opt === userAnswer
    );
    const correctOptionIndex = question.correctAnswer
      ? question.options.findIndex((opt) => opt === question.correctAnswer)
      : -1;

    if (userOptionIndex !== -1 && correctOptionIndex !== -1) {
      return userOptionIndex === correctOptionIndex;
    }
  }

  return false;
};

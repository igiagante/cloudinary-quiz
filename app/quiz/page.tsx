// app/quiz/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QuizCard from "@/components/quiz-card";
import QuizProgress from "@/components/quiz-progress";
import { QuizState, QuizQuestion } from "@/types";

export default function QuizPage() {
  const router = useRouter();
  const [quizState, setQuizState] = useState<
    QuizState & { optionIds: Record<string, string[]> }
  >({
    questions: [],
    currentQuestionIndex: 0,
    userAnswers: {},
    isComplete: false,
    optionIds: {}, // Store option IDs separately
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add state for submission loading
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizSettings, setQuizSettings] = useState<{
    model?: "openai" | "claude";
    topics?: string[];
  }>({});
  const [multiAnswerSubmitted, setMultiAnswerSubmitted] = useState<
    Record<string, boolean>
  >({});
  const [userId, setUserId] = useState<string>("1"); // Fallback to known user ID

  const currentQuestion = quizState.questions[quizState.currentQuestionIndex];

  useEffect(() => {
    try {
      setIsLoading(true);

      // Check if there's a saved quiz in localStorage
      const quizStateStr = localStorage.getItem("quizState");
      if (!quizStateStr) {
        setError("No quiz found. Please start a new quiz.");
        setIsLoading(false);
        return;
      }

      const savedQuizState = JSON.parse(quizStateStr);

      // Ensure optionIds is initialized even if it doesn't exist in the saved state
      setQuizState({
        ...savedQuizState,
        optionIds: savedQuizState.optionIds || {},
      });

      // When a quiz is loaded, fetch the actual questions from the server
      const quizId = localStorage.getItem("quizId");
      if (quizId) {
        console.log(`Fetching quiz data for ID: ${quizId}...`);
        // Get the real question UUIDs from the server
        fetch(`/api/quizzes/${quizId}`)
          .then((res) => {
            if (!res.ok) {
              console.error(`Failed to fetch quiz: ${res.status}`);
              throw new Error(`Failed to fetch quiz: ${res.status}`);
            }
            return res.json();
          })
          .then((serverQuiz) => {
            console.log("Retrieved quiz data from server:", serverQuiz);

            // Create a mapping of client-side question text to server-side question IDs
            const questionMap = new Map<string, QuizQuestion>();
            savedQuizState.questions.forEach((q: QuizQuestion) => {
              questionMap.set(q.question, q);
            });

            // Update the state with server questions matched by question text
            const syncedQuestions = serverQuiz.questions.map((serverQ: any) => {
              const clientQ = savedQuizState.questions.find(
                (q: QuizQuestion) =>
                  // Try to match by question text first
                  q.question === serverQ.question ||
                  // Or by the existing ID if available
                  q.id === serverQ.id
              );

              if (clientQ) {
                console.log(
                  `Synced question "${serverQ.question.substring(
                    0,
                    30
                  )}..." with ID ${serverQ.id}`
                );
                return {
                  ...clientQ,
                  id: serverQ.id, // Override with server UUID
                };
              }

              console.warn(
                `Could not find matching client question for "${serverQ.question.substring(
                  0,
                  30
                )}..."`
              );
              return serverQ;
            });

            console.log("Synced questions:", syncedQuestions);

            // Rebuild the answers map to use the new question IDs
            const updatedUserAnswers: Record<string, string | string[]> = {};
            Object.entries(savedQuizState.userAnswers || {}).forEach(
              ([oldId, answer]) => {
                const oldQuestion = savedQuizState.questions.find(
                  (q: QuizQuestion) => q.id === oldId
                );
                if (oldQuestion) {
                  const newQuestion = syncedQuestions.find(
                    (q: QuizQuestion) => q.question === oldQuestion.question
                  );
                  if (newQuestion) {
                    updatedUserAnswers[newQuestion.id] = answer as
                      | string
                      | string[];
                  }
                }
              }
            );

            // Rebuild the optionIds map to use the new question IDs
            const updatedOptionIds: Record<string, string[]> = {};
            Object.entries(savedQuizState.optionIds || {}).forEach(
              ([oldId, optionIds]) => {
                const oldQuestion = savedQuizState.questions.find(
                  (q: QuizQuestion) => q.id === oldId
                );
                if (oldQuestion) {
                  const newQuestion = syncedQuestions.find(
                    (q: QuizQuestion) => q.question === oldQuestion.question
                  );
                  if (newQuestion) {
                    updatedOptionIds[newQuestion.id] = optionIds as string[];
                  }
                }
              }
            );

            // Create updated state with synced data
            const syncedState = {
              ...savedQuizState,
              questions: syncedQuestions,
              userAnswers: updatedUserAnswers,
              optionIds: updatedOptionIds,
            };

            console.log("Final synced state:", syncedState);

            // Update the state
            setQuizState(syncedState);

            // Save the updated state to localStorage
            localStorage.setItem("quizState", JSON.stringify(syncedState));
          })
          .catch((error) => {
            console.error("Error fetching quiz data:", error);
            // Continue with saved state as fallback
          });
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Error loading quiz state:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      setIsLoading(false);
    }
  }, []);

  const handleAnswer = (
    questionId: string,
    answer: string | string[],
    optionIds?: string[]
  ) => {
    console.log("Answer selected for question:", questionId, {
      text: answer,
      optionIds,
    });

    setQuizState((prev) => ({
      ...prev,
      userAnswers: {
        ...prev.userAnswers,
        [questionId]: answer,
      },
      optionIds: {
        ...prev.optionIds,
        [questionId]: optionIds || [],
      },
    }));
  };

  const handleFeedback = async (questionId: string, isHelpful: boolean) => {
    try {
      await fetch("/api/question-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId,
          isHelpful,
          userId,
        }),
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  const handleNext = () => {
    if (quizState.currentQuestionIndex === quizState.questions.length - 1) {
      // Show loading spinner
      setIsSubmitting(true);

      // Quiz is complete, update state
      setQuizState((prev) => ({
        ...prev,
        isComplete: true,
      }));

      // Save quiz state to localStorage
      const completedQuizState = {
        ...quizState,
        isComplete: true,
      };
      localStorage.setItem("quizState", JSON.stringify(completedQuizState));

      // Save the quiz to the database
      saveQuizToDatabase(completedQuizState)
        .then(() => {
          // Navigate to results page after successful save
          router.push("/results");
        })
        .catch((error) => {
          console.error("Error saving quiz:", error);
          // Stop the spinner if there's an error
          setIsSubmitting(false);
          // Still navigate to results even if save fails
          router.push("/results");
        });
    } else {
      // Reset multi-answer submitted state for the next question
      const nextQuestionId =
        quizState.questions[quizState.currentQuestionIndex + 1].id;
      setMultiAnswerSubmitted((prev) => ({
        ...prev,
        [nextQuestionId]: false,
      }));

      // Clean up any potential cross-question option contamination
      // by making a copy of the current state before modifying it
      setQuizState((prev) => {
        // Make a deep copy to avoid references to the previous state
        const cleanedState = {
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex + 1,
          // Ensure optionIds exists
          optionIds: prev.optionIds || {},
        };

        // Log the navigation
        console.log(
          `Navigating from question ${prev.currentQuestionIndex + 1} to ${
            prev.currentQuestionIndex + 2
          }`
        );

        return cleanedState;
      });
    }
  };

  // Function to map user answers to option IDs
  const mapUserAnswersToOptionIds = (
    questions: QuizQuestion[],
    userAnswers: Record<string, string | string[]>,
    optionIds?: Record<string, string[]>
  ) => {
    return Object.entries(userAnswers).map(([questionId, answer]) => {
      // Find the question
      const question = questions.find((q) => q.id === questionId);

      if (!question) {
        console.warn(`Question ${questionId} not found when mapping answers`);
        return {
          questionId,
          answer: Array.isArray(answer) ? answer : [answer],
        };
      }

      // Format for the API - each answer needs to be in an array even for single-select questions
      const answerArray = Array.isArray(answer) ? answer : [answer];

      // Ensure we haven't kept invalid options (e.g. options from other questions)
      const validAnswerArray = answerArray.filter((opt) =>
        question.options.includes(opt)
      );

      // If the answer array is empty after filtering invalid options, use first option as fallback
      if (validAnswerArray.length === 0) {
        console.warn(
          `No valid options left for question ${questionId}, using fallback`
        );
        return {
          questionId,
          answer: ["1"], // Default to option 1
        };
      }

      // Map each answer to its option ID
      // First try to use stored optionIds if available
      if (optionIds && optionIds[questionId]) {
        // Remove any invalid IDs (0 or undefined)
        const validIds = optionIds[questionId]
          .filter((id) => id && id !== "0" && id !== "undefined")
          // Ensure we have an ID for each valid answer
          .slice(0, validAnswerArray.length);

        // If we have valid IDs that match the number of valid answers, use them
        if (validIds.length === validAnswerArray.length) {
          return {
            questionId,
            answer: validIds,
          };
        }
      }

      // Map each answer to its index+1 (as a string)
      const mappedIds = validAnswerArray.map((answerText) => {
        const index = question.options.findIndex((opt) => opt === answerText);
        return index !== -1 ? (index + 1).toString() : "1";
      });

      return {
        questionId,
        answer: mappedIds,
      };
    });
  };

  // Function to save quiz to database
  async function saveQuizToDatabase(quizState: {
    questions: QuizQuestion[];
    userAnswers: Record<string, string | string[]>;
    optionIds?: Record<string, string[]>;
    currentQuestionIndex: number;
    isComplete: boolean;
  }) {
    try {
      // CRITICAL FIX: Clean up any answers that contain invalid options from other questions
      const cleanedUserAnswers = Object.fromEntries(
        Object.entries(quizState.userAnswers).map(([questionId, answer]) => {
          const question = quizState.questions.find((q) => q.id === questionId);
          if (!question) return [questionId, answer];

          // For multiple-choice questions, filter to only include valid options
          if (Array.isArray(answer)) {
            const validOptions = answer.filter((opt) =>
              question.options.includes(opt)
            );

            console.log(`Cleaned answers for question ${questionId}:`, {
              original: answer,
              cleaned: validOptions,
              validCount: validOptions.length,
              invalidCount: answer.length - validOptions.length,
            });

            return [questionId, validOptions];
          }

          // For single-choice questions, verify the answer exists in options
          if (!question.options.includes(answer as string)) {
            console.warn(
              `Invalid answer for question ${questionId}, using first option as fallback`
            );
            return [questionId, question.options[0]];
          }

          return [questionId, answer];
        })
      );

      // Create a cleaned version of the quiz state for mapping
      const cleanedState = {
        ...quizState,
        userAnswers: cleanedUserAnswers,
      };

      // Update optionIds to match the cleaned answers
      Object.entries(cleanedUserAnswers).forEach(([questionId, answer]) => {
        if (Array.isArray(answer)) {
          const question = quizState.questions.find((q) => q.id === questionId);
          if (!question) return;

          // Map each valid option to its index+1
          const newOptionIds = answer.map((opt) => {
            const index = question.options.findIndex((o) => o === opt);
            return (index !== -1 ? index + 1 : 1).toString();
          });

          // Update the optionIds for this question
          if (cleanedState.optionIds) {
            cleanedState.optionIds[questionId] = newOptionIds;
          }
        }
      });

      // Now prepare answers using the improved mapping function with cleaned data
      const answers = mapUserAnswersToOptionIds(
        quizState.questions,
        cleanedUserAnswers,
        cleanedState.optionIds
      );

      // Debug answers mapping
      console.log("Original user answers:", quizState.userAnswers);
      console.log("Cleaned user answers:", cleanedUserAnswers);
      console.log("Option IDs stored:", quizState.optionIds);
      console.log("Final answers sent to API:", answers);

      // Log more detailed info about each answer
      console.log("\n===== DETAILED ANSWER INFORMATION =====");
      answers.forEach((answer, index) => {
        const question = quizState.questions.find(
          (q) => q.id === answer.questionId
        );
        console.log(`Answer ${index + 1}:`);
        console.log(`- Question ID: ${answer.questionId}`);
        console.log(
          `- Question text: ${question?.question?.substring(0, 30)}...`
        );
        console.log(`- Answer values: ${JSON.stringify(answer.answer)}`);
        console.log(
          `- Original user answer: ${JSON.stringify(
            quizState.userAnswers[answer.questionId]
          )}`
        );
        console.log(
          `- Cleaned user answer: ${JSON.stringify(
            cleanedUserAnswers[answer.questionId] || ""
          )}`
        );
        console.log(
          `- Mapped option IDs: ${JSON.stringify(
            cleanedState.optionIds?.[answer.questionId] || []
          )}`
        );
        console.log("---");
      });

      // Prepare the quiz answers data
      let quizId = localStorage.getItem("quizId");

      // If no quiz ID, create a new quiz first
      if (!quizId) {
        console.log("No quiz ID found, creating new quiz in database");

        // Create a new quiz in the database
        const createQuizResponse = await fetch("/api/quizzes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            numQuestions: quizState.questions.length,
            questionIds: quizState.questions.map((q: QuizQuestion) => q.id),
          }),
        });

        if (!createQuizResponse.ok) {
          console.error(
            "Failed to create quiz:",
            await createQuizResponse.text()
          );
          throw new Error("Failed to create quiz");
        }

        const quizData = await createQuizResponse.json();
        quizId = quizData.quizId;

        // Save the quiz ID to localStorage for future use
        localStorage.setItem(
          "quizId",
          typeof quizData.quizId === "object"
            ? quizData.quizId.id || String(quizData.quizId)
            : String(quizData.quizId)
        );
        console.log("Created new quiz with ID:", quizId);
      }

      // Verify that quizId exists after our creation attempt
      if (!quizId) {
        throw new Error("Failed to obtain quiz ID");
      }

      // TypeScript type narrowing - quizId is now definitely a string
      const finalQuizId: string = quizId;

      // Call API to save the quiz
      const response = await fetch("/api/quizzes/answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizId: finalQuizId,
          userId,
          answers: answers,
          isComplete: true,
        }),
      });

      if (!response.ok) {
        console.error("Failed to save quiz answers:", await response.text());
        throw new Error("Failed to save quiz");
      }

      return await response.json();
    } catch (error) {
      console.error("Error saving quiz:", error);
      throw error;
    }
  }

  const handlePrevious = () => {
    if (quizState.currentQuestionIndex > 0) {
      // Reset multi-answer submitted state for the previous question
      const prevQuestionId =
        quizState.questions[quizState.currentQuestionIndex - 1].id;
      setMultiAnswerSubmitted((prev) => ({
        ...prev,
        [prevQuestionId]: false,
      }));

      // Clean up any potential cross-question option contamination
      setQuizState((prev) => {
        // Make a deep copy to avoid references to the previous state
        const cleanedState = {
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex - 1,
          // Ensure optionIds exists
          optionIds: prev.optionIds || {},
        };

        // Log the navigation
        console.log(
          `Navigating from question ${prev.currentQuestionIndex + 1} to ${
            prev.currentQuestionIndex
          }`
        );

        return cleanedState;
      });
    }
  };

  const toggleReviewMode = () => {
    setIsReviewMode(!isReviewMode);
  };

  const allQuestionsAnswered = quizState.questions.every(
    (q) => quizState.userAnswers[q.id]
  );

  const handleMultiAnswerSubmit = (questionId: string) => {
    setMultiAnswerSubmitted((prev) => ({
      ...prev,
      [questionId]: true,
    }));
  };

  // Function to determine if explanation should be shown
  const shouldShowExplanation = (questionId: string) => {
    const question = quizState.questions.find((q) => q.id === questionId);
    const hasUserAnswer = !!quizState.userAnswers[questionId];

    if (!hasUserAnswer) return false;

    // For multiple-answer questions, require explicit submission
    if (question?.hasMultipleCorrectAnswers) {
      return !!multiAnswerSubmitted[questionId];
    }

    // For single-answer questions, show immediately after selection
    return true;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-6 bg-white shadow-lg rounded-lg max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Generating your quiz questions...
          </h2>
          <p className="text-gray-600 mb-4">
            This may take a moment as we create high-quality questions tailored
            to your selected topics.
          </p>

          {quizSettings.model && (
            <div className="text-sm font-medium bg-blue-50 text-blue-700 p-2 rounded-md mb-3">
              Using{" "}
              {quizSettings.model === "claude" ? "Claude AI" : "OpenAI GPT-4"}{" "}
              for question generation
            </div>
          )}

          <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded-md">
            <p>
              Quiz questions are being generated based on your selected
              preferences. New questions will be saved to our database for
              future use.
            </p>
            <p className="mt-2 text-xs">
              Note: AI generation may occasionally fail due to service limits.
              The system will automatically retry or switch models if needed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <div className="mt-4 flex flex-col space-y-2 items-center">
            <button
              onClick={() => router.push("/")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
            >
              Go Back Home
            </button>

            <button
              onClick={() => {
                // Clear quiz related data
                localStorage.removeItem("quizState");
                localStorage.removeItem("quizId");
                localStorage.removeItem("quizSettings");

                // Reload the page to start fresh
                window.location.href = "/";
              }}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded"
            >
              Reset Quiz Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isReviewMode) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Review All Questions</h1>
          <button
            onClick={toggleReviewMode}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Quiz
          </button>
        </div>

        {quizState.questions.map((question, index) => (
          <div key={question.id} className="mb-8">
            <div className="text-sm text-gray-500 mb-1">
              Question {index + 1}
            </div>
            <QuizCard
              question={question}
              onAnswer={handleAnswer}
              showExplanation={shouldShowExplanation(question.id)}
              userAnswer={quizState.userAnswers[question.id]}
              onFeedback={handleFeedback}
              onMultiAnswerSubmit={() => handleMultiAnswerSubmit(question.id)}
            />
          </div>
        ))}

        <div className="flex justify-between mt-6">
          <button
            onClick={toggleReviewMode}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded"
          >
            Back to Quiz
          </button>

          {allQuestionsAnswered && (
            <button
              onClick={() => {
                // Show submitting state
                setIsSubmitting(true);

                // Save quiz as complete in localStorage
                const completedQuizState = {
                  ...quizState,
                  isComplete: true,
                };
                localStorage.setItem(
                  "quizState",
                  JSON.stringify(completedQuizState)
                );

                // Save to database
                saveQuizToDatabase(completedQuizState)
                  .then(() => {
                    router.push("/results");
                  })
                  .catch((error) => {
                    setIsSubmitting(false);
                    console.error("Error saving quiz:", error);
                    router.push("/results");
                  });
              }}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                "View Results"
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <QuizProgress
        currentQuestion={quizState.currentQuestionIndex + 1}
        totalQuestions={quizState.questions.length}
        onReview={toggleReviewMode}
      />

      {currentQuestion && (
        <QuizCard
          question={currentQuestion}
          onAnswer={handleAnswer}
          showExplanation={shouldShowExplanation(currentQuestion.id)}
          userAnswer={quizState.userAnswers[currentQuestion.id]}
          onFeedback={handleFeedback}
          onMultiAnswerSubmit={() =>
            handleMultiAnswerSubmit(currentQuestion.id)
          }
        />
      )}

      <div className="flex justify-between mt-6">
        <button
          onClick={handlePrevious}
          disabled={quizState.currentQuestionIndex === 0}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded disabled:opacity-50"
        >
          Previous
        </button>

        <button
          onClick={handleNext}
          disabled={!quizState.userAnswers[currentQuestion?.id] || isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded disabled:opacity-50 flex items-center"
        >
          {quizState.currentQuestionIndex === quizState.questions.length - 1 ? (
            isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Submitting...
              </>
            ) : (
              "Finish Quiz"
            )
          ) : (
            "Next Question"
          )}
        </button>
      </div>
    </div>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { quizRepository } from "@/lib/db/repositories/quiz.repository";

// Input validation schema for submitting quiz answers
const submitAnswersSchema = z.object({
  quizId: z.string(),
  userId: z.string(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.array(z.string()),
    })
  ),
  isComplete: z.boolean().default(false),
});

function mapToValidTopicEnum(topic: string): string {
  // Map full topic names to the enum values required by the database
  if (
    topic.includes("Products") ||
    topic.includes("Value") ||
    topic.includes("Environment")
  )
    return "Products";
  if (topic.includes("Architecture")) return "Architecture";
  if (topic.includes("Lifecycle") || topic.includes("Emerging"))
    return "Lifecycle";
  if (
    topic.includes("Widget") ||
    topic.includes("Add-on") ||
    topic.includes("Integration")
  )
    return "Widgets";
  if (
    topic.includes("Upload") ||
    topic.includes("Migrate") ||
    topic.includes("Asset")
  )
    return "Assets";
  if (topic.includes("Transform")) return "Transformations";
  if (topic.includes("Media") || topic.includes("Management"))
    return "Management";
  if (
    topic.includes("User") ||
    topic.includes("Role") ||
    topic.includes("Access") ||
    topic.includes("Control")
  )
    return "Access";

  // Default fallback
  console.warn(
    `Could not map topic: ${topic} to valid enum value, using default "Products"`
  );
  return "Products";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quizId, userId, answers, isComplete } =
      submitAnswersSchema.parse(body);

    // Get quiz by UUID
    const quiz = await quizRepository.getById(quizId);
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    if (quiz.isCompleted) {
      return NextResponse.json(
        { error: "Cannot update answers for completed quiz" },
        { status: 400 }
      );
    }

    // Before processing answers, verify question IDs match
    const clientQuestionIds = new Set(answers.map((a) => a.questionId));
    const serverQuestionIds = new Set(quiz.questions.map((q) => q.questionId));

    // Log any questions that don't match
    clientQuestionIds.forEach((id) => {
      if (!serverQuestionIds.has(id)) {
        console.error(
          `Client sent question ID ${id} that doesn't exist in the server quiz`
        );
      }
    });

    // At the beginning, right after we get the quiz
    console.log("Available questions in this quiz:");
    quiz.questions.forEach((q, idx) => {
      console.log(
        `  [${idx + 1}] ID: ${q.questionId}, Topic: ${q.question.topic}`
      );
    });

    console.log("Question IDs received from client:");
    answers.forEach((a, idx) => {
      console.log(`  [${idx + 1}] ${a.questionId}`);
    });

    // Process each answer
    const processedAnswers = [];
    let correctCount = 0;

    // Use the actual quiz question count for totals
    const totalQuestions = quiz.questions.length;
    console.log(`Quiz has ${totalQuestions} total questions`);
    console.log(`Received ${answers.length} answers from client`);

    // Fix for duplicate answers
    const uniqueAnswerMap = new Map();
    answers.forEach((a: { questionId: string; answer: string[] }) => {
      // If we already have this question ID, keep the one with more answers
      if (uniqueAnswerMap.has(a.questionId)) {
        const existing = uniqueAnswerMap.get(a.questionId);
        // If the new answer has more options, replace the existing one
        if (a.answer.length > existing.answer.length) {
          console.log(
            `Replacing duplicate answer for question ${a.questionId} with more complete version`
          );
          uniqueAnswerMap.set(a.questionId, a);
        }
      } else {
        uniqueAnswerMap.set(a.questionId, a);
      }
    });

    // Convert map back to array
    const dedupedAnswers = Array.from(uniqueAnswerMap.values());
    console.log(
      `Deduped answers: ${answers.length} -> ${dedupedAnswers.length}`
    );

    // Remove duplicate option IDs within a single answer
    const uniqueOptionAnswers = dedupedAnswers.map(
      (a: { questionId: string; answer: string[] }) => {
        // Remove duplicate option IDs from the same answer
        const uniqueOptions = Array.from(new Set(a.answer));

        // Log if we found duplicates
        if (uniqueOptions.length !== a.answer.length) {
          console.log(
            `Found duplicate options in answer for question ${a.questionId}: ${a.answer} -> ${uniqueOptions}`
          );
        }

        return {
          ...a,
          answer: uniqueOptions,
        };
      }
    );

    // Final filtered answers to process
    const finalAnswers = uniqueOptionAnswers;

    // Create a map of all questions by their UUID for easier processing
    const questionMap = new Map();
    quiz.questions.forEach((qItem) => {
      questionMap.set(qItem.questionId, {
        question: qItem.question,
        processed: false,
        isCorrect: false,
      });
    });

    // Log all available questions for debugging
    console.log("\n===== ALL QUESTIONS IN QUIZ =====");
    quiz.questions.forEach((q, idx) => {
      console.log(
        `[${idx + 1}] ID: ${q.questionId}, Topic: ${q.question.topic}`
      );
    });

    console.log("\n===== PROCESSING ANSWERS =====");

    // Get all questions from the quiz
    for (const answerItem of finalAnswers) {
      const { questionId, answer } = answerItem;
      const questionInQuiz = quiz.questions.find(
        (q) => q.questionId === questionId
      );

      if (!questionInQuiz) {
        console.warn(`Question ${questionId} not found in quiz`);
        continue; // Skip if question not found in quiz
      }

      const question = questionInQuiz.question;

      // Process single or multiple answers
      let isCorrect = false;

      console.log(`Processing answer for question "${questionId}":`);
      console.log(`- Answer received from client:`, answer);
      console.log(
        `- Question has multiple correct answers:`,
        question.hasMultipleCorrectAnswers
      );

      // Get all options for this question with their IDs and correctness
      const optionsWithDetails = question.options.map((opt, index) => ({
        id: opt.id,
        index: index + 1, // 1-based index
        text: opt.text,
        isCorrect: opt.isCorrect,
      }));

      console.log(
        `- Available options:`,
        optionsWithDetails.map(
          (o) =>
            `ID:${o.id}, Index:${o.index}, Correct:${
              o.isCorrect
            }, Text:"${o.text.substring(0, 20)}..."`
        )
      );

      if (question.hasMultipleCorrectAnswers) {
        // For multiple answer questions - check if all correct options are selected and no incorrect ones
        const correctOptionIds = question.options
          .filter((o) => o.isCorrect)
          .map((o) => {
            // Try both ID and index-based matching
            return [
              o.id.toString(),
              (
                optionsWithDetails.find((opt) => opt.id === o.id)?.index || 0
              ).toString(),
            ];
          })
          .flat();

        console.log(`- Expected correct option IDs:`, correctOptionIds);

        // Check if all required correct answers are provided (and no extra ones)
        const allCorrectAnswersSelected = correctOptionIds.every((id) => {
          return answer.some((ans) => ans === id || ans.toString() === id);
        });

        const correctOptionCount = correctOptionIds.length;
        const selectedCorrectCount = answer.filter(
          (ans) =>
            correctOptionIds.includes(ans) ||
            correctOptionIds.includes(ans.toString())
        ).length;

        isCorrect =
          allCorrectAnswersSelected &&
          selectedCorrectCount === correctOptionCount;

        console.log(
          `- Multiple answer validation: ${isCorrect ? "CORRECT" : "INCORRECT"}`
        );
        console.log(
          `  Expected ${correctOptionCount} correct answers, user selected ${selectedCorrectCount} correct options`
        );
      } else {
        // For single answer questions - find the correct option
        const correctOption = question.options.find((o) => o.isCorrect);

        if (correctOption) {
          const correctOptionId = correctOption.id.toString();
          const correctOptionIndex = (
            optionsWithDetails.find((o) => o.id === correctOption.id)?.index ||
            0
          ).toString();

          console.log(
            `- Expected correct option: ID:${correctOptionId}, Index:${correctOptionIndex}`
          );

          // Check if the user's answer matches either the ID or the index of the correct option
          isCorrect =
            answer.length === 1 &&
            (answer[0] === correctOptionId || answer[0] === correctOptionIndex);

          console.log(
            `- Single answer validation: ${isCorrect ? "CORRECT" : "INCORRECT"}`
          );
          console.log(`  User selected: ${answer[0]}`);
        } else {
          console.warn(`No correct option found for question ${questionId}!`);
        }
      }

      // Update the answer in the database
      try {
        // Only proceed if we have a valid answer
        if (answer && answer.length > 0) {
          console.log(`Attempting to save answer for question ${questionId}`);

          // Try different ways of parsing the answer
          let answerId = null;
          let retryCount = 0;
          let savedSuccessfully = false;

          // Get all answer values as strings for logging
          const answerValues = answer
            .map((ans) => `${ans} (${typeof ans})`)
            .join(", ");
          console.log(`Answer values: ${answerValues}`);

          // First attempt - try to parse as number (this is the option index)
          if (answer[0] && !isNaN(parseInt(answer[0], 10))) {
            const selectedIndex = parseInt(answer[0], 10);
            console.log(`Selected option index: ${selectedIndex}`);

            // Find the actual option by index from optionsWithDetails
            const selectedOption = optionsWithDetails.find(
              (o) => o.index === selectedIndex
            );

            if (selectedOption) {
              // Use the ACTUAL option ID from the database, not the index
              answerId = selectedOption.id;
              console.log(
                `Mapped index ${selectedIndex} to actual option ID: ${answerId}`
              );

              try {
                await quizRepository.updateQuizAnswer(
                  quiz.id,
                  questionId,
                  answerId, // Use the actual option ID
                  isCorrect
                );
                savedSuccessfully = true;
                console.log(
                  `Successfully saved answer with actual option ID ${answerId}`
                );
              } catch (e) {
                console.error(`First attempt failed:`, e);
                retryCount++;
              }
            } else {
              console.warn(`Could not find option with index ${selectedIndex}`);
              retryCount++;
            }
          }

          // Second attempt - try with actual option ID
          if (!savedSuccessfully && retryCount < 2) {
            console.log(`Retry ${retryCount}: Looking up option by index`);

            try {
              const selectedIndex = Number(answer[0]);
              // Find the actual option ID based on index
              const selectedOption = optionsWithDetails.find(
                (o) => o.index === selectedIndex
              );

              if (selectedOption) {
                const actualOptionId = selectedOption.id;
                console.log(
                  `Found option ID ${actualOptionId} for index ${selectedIndex}`
                );

                await quizRepository.updateQuizAnswer(
                  quiz.id,
                  questionId,
                  actualOptionId,
                  isCorrect
                );
                savedSuccessfully = true;
                console.log(`Retry succeeded with actual option ID`);
              } else {
                console.warn(
                  `Could not find option with index ${selectedIndex}, using null`
                );
                await quizRepository.updateQuizAnswer(
                  quiz.id,
                  questionId,
                  null,
                  isCorrect
                );
                savedSuccessfully = true;
              }
            } catch (e) {
              console.error(`Retry ${retryCount} failed:`, e);
              retryCount++;
            }
          }

          // Final attempt - use null but still mark correct/incorrect
          if (!savedSuccessfully) {
            console.log(
              `Final attempt: Using null as answer ID but setting isCorrect=${isCorrect}`
            );
            try {
              await quizRepository.updateQuizAnswer(
                quiz.id,
                questionId, // Use the UUID, not the internal ID
                null,
                isCorrect
              );
              savedSuccessfully = true;
              console.log(`Final attempt succeeded with null answer ID`);
            } catch (e) {
              console.error(`All attempts failed:`, e);
              throw e; // Re-throw to be caught by outer catch
            }
          }

          if (isCorrect) {
            correctCount++;
          }

          // Mark this question as processed in our map
          if (questionMap.has(questionId)) {
            const qData = questionMap.get(questionId);
            qData.processed = true;
            qData.isCorrect = isCorrect;
            questionMap.set(questionId, qData);
          }
        } else {
          console.warn(`No answer values provided for question ${questionId}`);
        }
      } catch (error) {
        console.error(
          `Error updating answer for question ${questionId}:`,
          error
        );
        // Continue with other answers rather than failing the entire request
      }

      processedAnswers.push({
        questionId,
        isCorrect,
      });
    }

    // If the quiz is marked as complete, update its status
    if (isComplete) {
      const score = Math.round((correctCount / totalQuestions) * 100);

      // Calculate topic performance
      const topicPerformance: Record<
        string,
        { correct: number; total: number }
      > = {};

      console.log("Processing topic performance for quiz completion");
      console.log("Total questions in quiz:", quiz.questions.length);
      console.log("Total answers submitted:", processedAnswers.length);

      // Debug the questions data
      quiz.questions.forEach((qItem, index) => {
        const isProcessed =
          questionMap.get(qItem.questionId)?.processed || false;
        console.log(
          `Question ${index + 1} - Topic: ${
            qItem.question.topic
          }, Answered: ${isProcessed}`
        );
      });

      // Enhanced debugging - log all topics from all questions
      console.log("\n===== DEBUG: ALL TOPICS IN QUIZ =====");
      const allTopics = quiz.questions.map((q) => q.question.topic);
      const uniqueTopics = [...new Set(allTopics)];

      console.log(
        `Quiz has ${uniqueTopics.length} unique topics: ${uniqueTopics.join(
          ", "
        )}`
      );

      // Count questions per topic
      const topicCounts: Record<string, number> = {};
      allTopics.forEach((topic) => {
        if (topic) {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        }
      });

      console.log("Questions per topic:", JSON.stringify(topicCounts, null, 2));

      // Additional logging for topic enum mapping
      console.log("\n===== DEBUG: TOPIC MAPPING =====");
      for (const topic of uniqueTopics) {
        const mappedTopic = mapToValidTopicEnum(topic);
        console.log(`Topic "${topic}" maps to enum value "${mappedTopic}"`);
      }

      // Enhanced debug for topicPerformance
      console.log("\n===== DEBUG: TOPIC PERFORMANCE CALCULATION =====");

      for (const qItem of quiz.questions) {
        const topic = qItem.question.topic;

        // Make sure topic is a valid string
        if (!topic || typeof topic !== "string") {
          console.error(
            "Invalid topic for question:",
            qItem.question.id,
            qItem.question.topic
          );
          continue;
        }

        if (!topicPerformance[topic]) {
          topicPerformance[topic] = { correct: 0, total: 0 };
          console.log(`Initialized new topic: ${topic}`);
        }

        // IMPORTANT: Count EVERY question in the total, even if not answered
        topicPerformance[topic].total++;

        // Check if this question was answered and if so, whether it was correct
        const questionData = questionMap.get(qItem.questionId);
        if (questionData && questionData.processed) {
          console.log(
            `Question for topic ${topic} - Answer found, isCorrect: ${questionData.isCorrect}`
          );

          if (questionData.isCorrect) {
            topicPerformance[topic].correct++;
          }
        } else {
          console.warn(
            `No answer found for question ${qItem.questionId} in topic ${topic}`
          );
        }
      }

      // Format topic performance for the repository
      const topicPerformanceData = Object.entries(topicPerformance).map(
        ([topic, data]) => ({
          topic: mapToValidTopicEnum(topic),
          correct: data.correct,
          total: data.total,
          percentage:
            data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
        })
      );

      // Log the final mapped data for database insertion
      console.log("\n===== DEBUG: FINAL TOPIC PERFORMANCE DATA =====");
      console.log(JSON.stringify(topicPerformanceData, null, 2));

      // Check if there are any duplicate topics after mapping
      const mappedTopics = topicPerformanceData.map((tp) => tp.topic);
      const uniqueMappedTopics = [...new Set(mappedTopics)];

      if (mappedTopics.length !== uniqueMappedTopics.length) {
        console.warn("WARNING: Duplicate topics found after mapping!");
        console.warn(
          `Original count: ${mappedTopics.length}, Unique count: ${uniqueMappedTopics.length}`
        );

        // Find duplicates
        const duplicates = mappedTopics.filter(
          (item, index) => mappedTopics.indexOf(item) !== index
        );
        console.warn("Duplicate topics:", duplicates);
      }

      // Complete the quiz
      await quizRepository.completeQuiz(quiz.id, score, topicPerformanceData);
    }

    return NextResponse.json({
      success: true,
      processed: processedAnswers.length,
      correct: correctCount,
      score: isComplete
        ? Math.round((correctCount / totalQuestions) * 100)
        : null,
    });
  } catch (error) {
    console.error("Error saving quiz answers:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save quiz answers",
      },
      { status: 500 }
    );
  }
}

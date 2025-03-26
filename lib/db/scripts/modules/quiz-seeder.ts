import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { parseQuizDocument } from "../../parser/quiz-parser";
import { ParsedQuestion } from "../../parser/quiz-markdown-parser";
import { db, schema } from "./db";
import { log, getTopic } from "./utils";
import { cleanDatabase } from "./clean";
import { seedTopics } from "./topic-manager";
import { createTestUser } from "./user-manager";
import { checkQuestions } from "./check-questions";

/**
 * Insert a question from the parser format to the database
 */
export async function insertNewQuestionToDatabase(q: ParsedQuestion) {
  // Ensure the topic is always mapped to an official Cloudinary exam topic
  let topicValue = q.topic || "General";

  // Map legacy topic names to official ones if needed
  if (topicValue === "Access") {
    topicValue = "User, Role, and Group Management and Access Controls";
  }

  const difficultyValue = q.difficulty || "medium";
  const questionId = uuidv4();

  // Format options for the JSONB field
  const optionsArray = q.options;

  // Get correct answer (primary correct answer)
  const correctAnswer = q.options[q.correctAnswerIndex] || "";

  // Prepare correct answers array for multi-select questions
  const correctAnswersArray = q.correctAnswerIndices
    ? q.correctAnswerIndices.map((index) => q.options[index])
    : null;

  // Insert the question
  const [questionResult] = await db
    .insert(schema.questions)
    .values({
      id: questionId,
      uuid: uuidv4(),
      question: q.question,
      options: optionsArray as any, // JSONB field for options array
      correctAnswer: correctAnswer,
      explanation:
        q.explanation || "The correct answer is the most appropriate option.",
      topic: topicValue,
      difficulty: difficultyValue,
      source: q.source || "markdown",
      qualityScore: 80,
      usageCount: 0,
      successRate: 0,
      feedbackCount: 0,
      positiveRatings: 0,
      // Save multiple answers info
      hasMultipleCorrectAnswers: q.hasMultipleCorrectAnswers || false,
      correctAnswers: correctAnswersArray as any, // Save as string array
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  // Insert the options
  for (let i = 0; i < q.options.length; i++) {
    // Determine if this option is correct
    let isCorrect = false;

    // For multiple correct answers
    if (q.hasMultipleCorrectAnswers && q.correctAnswerIndices) {
      isCorrect = q.correctAnswerIndices.includes(i);
    } else {
      // For single correct answer
      isCorrect = i === q.correctAnswerIndex;
    }

    await db.insert(schema.options).values({
      questionId: questionResult.id,
      text: q.options[i],
      isCorrect: isCorrect,
      createdAt: new Date(),
    });
  }

  return questionResult;
}

/**
 * Display a summary of parsed questions for verification
 */
export function displayQuestionsSummary(questions: ParsedQuestion[]): void {
  log("\n📋 Summary of parsed questions:", "bright");
  log("---------------------------");
  log("# | Topic | Options | Answer | MultiAns | Question Preview");
  log("---------------------------");

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    // Get the answer letter(s)
    let answerLetters = String.fromCharCode(65 + q.correctAnswerIndex);
    if (q.hasMultipleCorrectAnswers && q.correctAnswerIndices) {
      answerLetters = q.correctAnswerIndices
        .map((idx: number) => String.fromCharCode(65 + idx))
        .join(",");
    }

    // Get a short snippet of the question text
    const textSnippet = q.question.substring(0, 30).replace(/\n/g, " ") + "...";

    // Map topicId to topic name if needed
    const topicDisplay =
      q.topic || (q.topicId ? getTopic(q.topicId) : "Unknown");

    log(
      `${(i + 1).toString().padStart(2)} | ${topicDisplay
        .substring(0, 5)
        .padStart(5)} | ${q.options.length
        .toString()
        .padStart(7)} | ${answerLetters.padStart(6)} | ${
        q.hasMultipleCorrectAnswers ? "Yes" : "No"
      } | ${textSnippet}`
    );
  }
  log("---------------------------");
}

/**
 * Custom parser for markdown quiz files
 * Replaces the smartParseMarkdownQuiz function that had import issues
 */
export function parseMarkdownQuiz(filePath: string): ParsedQuestion[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const questions: ParsedQuestion[] = [];

  const fileName = path.basename(filePath);
  let topicFromFile = getTopicFromFileName(fileName);

  // Try to find questions section
  let questionsSection;
  let answersSection;

  // Check for format with "## Questions" and "## Answers"
  if (content.includes("## Questions") && content.includes("## Answers")) {
    questionsSection = content.split("## Questions")[1]?.split("## Answers")[0];
    answersSection = content.split("## Answers")[1];
  }
  // Check for alternative format with questions directly after instructions
  else if (content.includes("## Instructions") && content.includes("**1.")) {
    const instructionsEnd = content.indexOf("**1.");
    const instructionsSection = content.substring(0, instructionsEnd);
    questionsSection = content.substring(instructionsEnd);

    // Try to find answers at the end
    if (content.includes("## Answer Key") || content.includes("## Answers")) {
      const answerSectionStart = Math.max(
        content.indexOf("## Answer Key"),
        content.indexOf("## Answers")
      );
      answersSection = content.substring(answerSectionStart);
      questionsSection = content.substring(instructionsEnd, answerSectionStart);
    }
  }

  if (!questionsSection) {
    log(`Could not find Questions section in ${fileName}`, "red");
    return [];
  }

  // Extract content sections and map them to official Cloudinary topics
  const topicSections: Map<string, string> = new Map();

  // Find all section headers (## Something) in the content
  const sectionMatches = [...content.matchAll(/^##\s+(.*?)$/gm)];
  for (let i = 0; i < sectionMatches.length - 1; i++) {
    const sectionName = sectionMatches[i][1].trim();
    const sectionStart = content.indexOf(sectionMatches[i][0]);
    const sectionEnd = content.indexOf(sectionMatches[i + 1][0], sectionStart);

    if (sectionStart > 0 && sectionEnd > sectionStart) {
      const sectionContent = content.substring(sectionStart, sectionEnd);

      // Map section names to official topics
      let officialTopic = mapSectionToOfficialTopic(sectionName);
      if (officialTopic) {
        topicSections.set(sectionName, officialTopic);
      }
    }
  }

  // Parse answers
  const answerMap = new Map<number, string[]>();

  if (answersSection) {
    const answerLines = answersSection
      .split("\n")
      .filter((line) => line.trim().length > 0);

    for (const line of answerLines) {
      // Try different answer formats
      const match1 = line.match(/(\d+)\.\s+([A-Z,\s]+)\s*-\s*(.*)/);
      const match2 = line.match(/(\d+)\.\s+([A-Z])\s*-?\s*(.*)/);

      if (match1) {
        const questionNumber = parseInt(match1[1]);
        const answers = match1[2].split(",").map((a) => a.trim());
        answerMap.set(questionNumber, answers);
      } else if (match2) {
        const questionNumber = parseInt(match2[1]);
        const answer = match2[2].trim();
        answerMap.set(questionNumber, [answer]);
      }
    }
  }

  // We need a more robust pattern that handles all question formats
  const questionPositions: { number: number; index: number }[] = [];

  // Find all question markers by searching for the pattern "**X. "
  const lines = questionsSection.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const questionMarker = line.match(/^\*\*(\d+)\.\s/);
    if (questionMarker) {
      const questionNumber = parseInt(questionMarker[1]);
      // Get the offset in the full text
      const offset = questionsSection.indexOf(line);
      if (offset !== -1) {
        questionPositions.push({
          number: questionNumber,
          index: offset,
        });
      }
    }
  }

  // Sort by position in the document to ensure correct order
  questionPositions.sort((a, b) => a.index - b.index);

  // Debug info
  log(
    `Found ${questionPositions.length} question markers in ${fileName}`,
    "dim"
  );

  // Process each question
  for (let i = 0; i < questionPositions.length; i++) {
    const currentPos = questionPositions[i];
    const nextPos =
      i < questionPositions.length - 1 ? questionPositions[i + 1] : null;

    // Extract question text and options
    const questionStartIndex = currentPos.index;
    const questionEndIndex = nextPos ? nextPos.index : questionsSection.length;
    const questionBlock = questionsSection
      .substring(questionStartIndex, questionEndIndex)
      .trim();

    // Find the question number and text
    // Updated regex to handle question text that may contain code blocks
    // This regex matches the question number and captures everything until the first option or the end of the question block
    const questionMatch = questionBlock.match(
      /^\*\*(\d+)\.\s+([\s\S]*?)(?=\n\s*[-*]\s+[A-Z]\)|\n\s*```|\n\s*\n|$)/
    );

    if (!questionMatch) {
      log(
        `⚠️ Could not extract question text for question ${currentPos.number}`,
        "yellow"
      );
      continue;
    }

    const questionNumber = parseInt(questionMatch[1]);
    // Clean up the question text, removing any trailing **
    let questionText = questionMatch[2].replace(/\*\*$/, "").trim();

    // Special handling for questions with code blocks
    if (questionBlock.includes("```") && !questionText.includes("```")) {
      // Find the closing ** after the code block
      const fullQuestionMatch = questionBlock.match(
        /^\*\*(\d+)\.\s+([\s\S]*?)\*\*/
      );
      if (fullQuestionMatch) {
        questionText = fullQuestionMatch[2].trim();
      }

      // If question 5 which has a known format issue
      if (questionNumber === 5) {
        // Extract everything from the question marker to "How are the transformations applied?"
        const specialQuestion5Match = questionBlock.match(
          /^\*\*5\.\s+([\s\S]*?How are the transformations applied\?\*\*)/
        );
        if (specialQuestion5Match) {
          questionText = specialQuestion5Match[1].trim();
        }
      }
    }

    if (!questionText) {
      log(`⚠️ Empty question text for question ${questionNumber}`, "yellow");
      continue;
    }

    // Find topic for this question by looking for the most recent section header before this question
    let questionTopic = topicFromFile;

    // Find the position of this question in the full content
    const questionFullPosition = content.indexOf(questionBlock);

    // Look at all section headers and find the most recent one before this question
    if (sectionMatches.length > 0) {
      for (let j = sectionMatches.length - 1; j >= 0; j--) {
        const sectionStart = content.indexOf(sectionMatches[j][0]);
        if (sectionStart < questionFullPosition) {
          const sectionName = sectionMatches[j][1].trim();
          const officialTopic = mapSectionToOfficialTopic(sectionName);
          if (officialTopic) {
            questionTopic = officialTopic;
            break;
          }
        }
      }
    }

    // Find option markers in the question block
    const optionMarkers = [
      ...questionBlock.matchAll(/^-\s+([A-Z])\)\s+(.*)$/gm),
    ];

    // If no option markers found using the dash format, try alternative formats
    if (optionMarkers.length === 0) {
      // Try to find options in the format "A) Some option"
      const altOptionMarkers = [
        ...questionBlock.matchAll(/^([A-Z])\)\s+(.*)$/gm),
      ];
    }

    // Extract options with potential code blocks
    let options: string[] = [];

    // Special handling for code-based questions
    const hasCodeBlocks = questionBlock.includes("```");

    if (hasCodeBlocks) {
      // Extract code blocks with option letters
      const codeBlockRegex = new RegExp(/([A-Z])\)\s*```[\s\S]*?```/g);
      const codeMatches = [...questionBlock.matchAll(codeBlockRegex)];

      if (codeMatches.length > 0) {
        // We found code block options
        for (const codeMatch of codeMatches) {
          options.push(codeMatch[0].substring(3).trim()); // Remove "X) " prefix
        }
      }
    }

    // If we haven't extracted options via code blocks, use the regular parser
    if (options.length === 0) {
      // Try to find options marked with "- A)", "- B)", etc.
      const dashOptionRegex =
        /^-\s+([A-Z])\)\s+(.*(?:\n(?!-\s+[A-Z]\)|$).*)*)$/gm;
      const dashMatches = [...questionBlock.matchAll(dashOptionRegex)];

      if (dashMatches.length > 0) {
        // We found dash-format options
        for (const match of dashMatches) {
          options.push(match[2].trim());
        }
      } else {
        // Fall back to the line-by-line parser
        let currentOption = "";
        let collectingCodeBlock = false;
        let optionLetter = "";

        // Split by lines and process
        const lines = questionBlock.split("\n");

        for (let j = 0; j < lines.length; j++) {
          const line = lines[j].trim();

          // Check for option pattern outside of code blocks
          if (!collectingCodeBlock) {
            // Try both "A) Option" and "- A) Option" formats
            const optionMatch = line.match(/^(?:-\s+)?([A-Z])\)\s+(.*)/);

            if (optionMatch) {
              // Save previous option if exists
              if (currentOption && optionLetter) {
                options.push(currentOption.trim());
              }

              // Start new option
              optionLetter = optionMatch[1];
              currentOption = optionMatch[2];

              // Check if this option starts a code block
              if (currentOption.includes("```")) {
                collectingCodeBlock = true;
                // Keep collecting the code block in subsequent lines
              }
              continue;
            }
          }

          // Handle code blocks and their continuations
          if (line.includes("```") && collectingCodeBlock) {
            // End of code block
            collectingCodeBlock = false;
            currentOption += "\n" + line;
            continue;
          }

          if (collectingCodeBlock || currentOption) {
            // Continue collecting current option (in code block or not)
            currentOption += "\n" + line;
          }
        }

        // Add the last option if exists
        if (currentOption && optionLetter) {
          options.push(currentOption.trim());
        }
      }
    }

    // Clean up options by removing difficulty info and other metadata
    options = options.map((option) => {
      // Remove difficulty pattern and everything after it
      const difficultyPattern = /\*\*Difficulty:\*\*\s*.*/;
      return option.replace(difficultyPattern, "").trim();
    });

    // Now check if the last option still contains multiple lines with metadata
    if (options.length > 0) {
      const lastOption = options[options.length - 1];

      // If the last option contains multiple lines, keep only the first line
      if (lastOption.includes("\n\n")) {
        options[options.length - 1] = lastOption.split("\n\n")[0].trim();
      }
    }

    // Extract difficulty
    let difficulty = "medium";
    const difficultyMatch = questionBlock.match(/\*\*Difficulty:\*\*\s*(.*)/);
    if (difficultyMatch) {
      difficulty = difficultyMatch[1].toLowerCase();
    }

    // Determine correct answer(s)
    const correctAnswerLetters = answerMap.get(questionNumber) || ["A"];

    // Convert letters to indices (A=0, B=1, etc.)
    const correctAnswerIndices = correctAnswerLetters.map(
      (letter) => letter.charCodeAt(0) - "A".charCodeAt(0)
    );

    // Check for multiple answers
    const hasMultipleCorrectAnswers = correctAnswerIndices.length > 1;

    // Create explanation from answers section
    let explanation = "";
    if (answerMap.has(questionNumber)) {
      const answerLines = (answersSection || "").split("\n");
      const answerLine = answerLines.find((line) =>
        line.match(new RegExp(`^${questionNumber}\\.`))
      );

      if (answerLine) {
        const parts = answerLine.split("-");
        if (parts.length > 1) {
          explanation = parts.slice(1).join("-").trim();
        } else {
          explanation = answerLine
            .substring(answerLine.indexOf(" ") + 1)
            .trim();
        }
      }
    }

    // If no options were found, log a detailed warning and skip this question
    if (options.length === 0) {
      log(
        `⚠️ Skipping question ${questionNumber} - no options found`,
        "yellow"
      );
      log(`Question text: ${questionText.substring(0, 100)}...`, "dim");
      log(`Question block length: ${questionBlock.length} chars`, "dim");
      continue;
    }

    // Add the question
    questions.push({
      question: questionText,
      options,
      correctAnswerIndex: correctAnswerIndices[0],
      correctAnswerIndices: hasMultipleCorrectAnswers
        ? correctAnswerIndices
        : undefined,
      hasMultipleCorrectAnswers,
      explanation,
      topic: questionTopic,
      difficulty: difficulty as any,
      source: "markdown",
      topicId: undefined,
    });
  }

  log(
    `Successfully parsed ${questions.length} questions from ${fileName}`,
    "green"
  );
  return questions;
}

// Helper function to map section headings to official topics
function mapSectionToOfficialTopic(sectionName: string): string | null {
  // Map section names to official Cloudinary exam topics
  const topicMap: Record<string, string> = {
    "Products, Value, Environment Settings, and Implementation Strategies":
      "Products, Value, Environment Settings, and Implementation Strategies",
    "System Architecture and Integration": "System Architecture",
    "Media Management and Upload": "Media Management",
    "Transformations and Delivery": "Transformations",
    "User, Role, and Group Management":
      "User, Role, and Group Management and Access Controls",
    "Access Controls": "User, Role, and Group Management and Access Controls",
    "Widgets, Add-ons, and Custom Integrations":
      "Widgets, Out of Box Add-ons, Custom Integrations",
    "Lifecycle Strategy and Emerging Trends":
      "Media Lifecycle Strategy and Emerging Trends",
  };

  // Check for exact match first
  if (topicMap[sectionName]) {
    return topicMap[sectionName];
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(topicMap)) {
    if (sectionName.includes(key) || key.includes(sectionName)) {
      return value;
    }
  }

  // Special cases
  if (sectionName.toLowerCase().includes("architecture")) {
    return "System Architecture";
  } else if (
    sectionName.toLowerCase().includes("user") ||
    sectionName.toLowerCase().includes("role") ||
    sectionName.toLowerCase().includes("access")
  ) {
    return "User, Role, and Group Management and Access Controls";
  } else if (sectionName.toLowerCase().includes("transform")) {
    return "Transformations";
  } else if (
    sectionName.toLowerCase().includes("widget") ||
    sectionName.toLowerCase().includes("integration")
  ) {
    return "Widgets, Out of Box Add-ons, Custom Integrations";
  } else if (
    sectionName.toLowerCase().includes("upload") ||
    sectionName.toLowerCase().includes("migrate")
  ) {
    return "Upload and Migrate Assets";
  } else if (sectionName.toLowerCase().includes("media")) {
    return "Media Management";
  } else if (
    sectionName.toLowerCase().includes("product") ||
    sectionName.toLowerCase().includes("value") ||
    sectionName.toLowerCase().includes("implementation")
  ) {
    return "Products, Value, Environment Settings, and Implementation Strategies";
  } else if (
    sectionName.toLowerCase().includes("lifecycle") ||
    sectionName.toLowerCase().includes("trend")
  ) {
    return "Media Lifecycle Strategy and Emerging Trends";
  }

  // Return null if no match is found
  return null;
}

// Helper function to derive topic from filename
function getTopicFromFileName(fileName: string): string {
  // Map of keywords to official Cloudinary exam topics
  const topicKeywords: Record<string, string> = {
    "user-role-management":
      "User, Role, and Group Management and Access Controls",
    "access-controls": "User, Role, and Group Management and Access Controls",
    "role-management": "User, Role, and Group Management and Access Controls",
    access: "User, Role, and Group Management and Access Controls", // Explicitly map 'access' to the correct topic
    transformations: "Transformations",
    upload: "Upload and Migrate Assets",
    migrate: "Upload and Migrate Assets",
    video: "Media Management",
    architecture: "System Architecture",
    widgets: "Widgets, Out of Box Add-ons, Custom Integrations",
    addons: "Widgets, Out of Box Add-ons, Custom Integrations",
    "products-value":
      "Products, Value, Environment Settings, and Implementation Strategies",
    lifecycle: "Media Lifecycle Strategy and Emerging Trends",
    management: "Media Management",
  };

  // Check for each keyword in the filename
  for (const [keyword, topic] of Object.entries(topicKeywords)) {
    if (fileName.toLowerCase().includes(keyword)) {
      return topic;
    }
  }

  // Default topic if none found
  return "General";
}

/**
 * Database seeding function that handles markdown sources
 * and initializes topics and users
 * @param sourcePath Path to the source file or directory
 * @param cleanFirst Whether to clean the database before seeding
 */
export async function seedDatabase(
  sourcePath: string,
  cleanFirst: boolean = false
): Promise<void> {
  try {
    log(`Starting comprehensive database seeding process`, "cyan");

    // Add overall timing
    const totalStartTime = Date.now();

    // Clean the database if requested
    if (cleanFirst) {
      log("Cleaning database before seeding...", "blue");
      await cleanDatabase(true); // Silent mode
      log("✓ Database cleaned", "green");
    }

    // Step 1: Seed topics
    log("Seeding topics...", "blue");
    await seedTopics();
    log("✓ Topics seeded successfully", "green");

    // Step 2: Create test user
    log("Creating test user...", "blue");
    await createTestUser();
    log("✓ Test user created successfully", "green");

    // Step 3: Process markdown source
    log(`Seeding questions from markdown source: ${sourcePath}`, "blue");

    // Process markdown source
    let directoryPath = sourcePath;

    // Check if the source is a file or directory
    const isDirectory = fs.lstatSync(sourcePath).isDirectory();

    if (isDirectory) {
      // Process all markdown files in the directory
      const files = fs
        .readdirSync(directoryPath)
        .filter((file) => file.endsWith(".md"))
        .map((file) => path.join(directoryPath, file));

      log(`Found ${files.length} markdown files to process`, "blue");

      let totalQuestions = 0;
      let totalSuccessCount = 0;
      let totalErrorCount = 0;

      // Process each file separately
      for (const filePath of files) {
        log(`Processing file: ${path.basename(filePath)}`, "blue");

        // Add file timing
        const fileStartTime = Date.now();

        // Parse the markdown file using our custom parser
        const questions = parseMarkdownQuiz(filePath);
        log(`  - Parsed ${questions.length} questions`, "blue");

        totalQuestions += questions.length;

        // Seed the database with the parsed questions
        let successCount = 0;
        let errorCount = 0;

        for (const q of questions) {
          try {
            await insertNewQuestionToDatabase(q);
            successCount++;
          } catch (error) {
            log(
              `  ✗ Error inserting question: ${q.question.substring(0, 50)}...`,
              "red"
            );
            console.error(error);
            errorCount++;
          }
        }

        const fileEndTime = Date.now();
        const fileDuration = ((fileEndTime - fileStartTime) / 1000).toFixed(2);

        log(
          `  ✓ Successfully inserted ${successCount} questions from ${path.basename(
            filePath
          )} in ${fileDuration}s`,
          "green"
        );
        if (errorCount > 0) {
          log(
            `  ✗ Failed to insert ${errorCount} questions from ${path.basename(
              filePath
            )}`,
            "yellow"
          );
        }

        totalSuccessCount += successCount;
        totalErrorCount += errorCount;
      }

      // Output the final summary
      log("=============================================", "dim");
      log("All quiz files processed:", "green");
      log("=============================================", "dim");

      log(`\n📊 Summary:`, "bright");
      log(
        `Processed ${files.length} files with ${totalQuestions} total questions`,
        "dim"
      );
      log(
        `Successfully inserted ${totalSuccessCount} questions to database`,
        "green"
      );

      if (totalErrorCount > 0) {
        log(`Failed to insert ${totalErrorCount} questions`, "yellow");
      }

      // Also add total time for markdown seeding
      const totalEndTime = Date.now();
      const totalDuration = ((totalEndTime - totalStartTime) / 1000).toFixed(2);
      log(`Total seeding time: ${totalDuration}s`, "bright");
    } else {
      // Process a single markdown file
      log(`Parsing and seeding from single file: ${sourcePath}`, "blue");

      // Add file timing
      const fileStartTime = Date.now();

      // Use our custom parser
      const questions = parseMarkdownQuiz(sourcePath);

      log(`Parsed ${questions.length} questions from ${sourcePath}`, "blue");

      // Validate that questions have between 2 and 5 options
      const invalidQuestions = questions.filter(
        (q: any) => q.options.length < 2 || q.options.length > 5
      );
      if (invalidQuestions.length > 0) {
        log(
          `⚠️ Warning: ${invalidQuestions.length} questions have fewer than 2 or more than 5 options`,
          "yellow"
        );
      }

      // Display a summary of the parsed questions
      displayQuestionsSummary(questions);

      // Seed the database with the parsed questions
      let successCount = 0;
      let errorCount = 0;

      for (const q of questions) {
        try {
          await insertNewQuestionToDatabase(q);
          successCount++;
        } catch (error) {
          log(
            `✗ Error inserting question: ${q.question.substring(0, 50)}...`,
            "red"
          );
          console.error(error);
          errorCount++;
        }
      }

      const fileEndTime = Date.now();
      const fileDuration = ((fileEndTime - fileStartTime) / 1000).toFixed(2);

      log(
        `✓ Successfully inserted ${successCount} questions to database in ${fileDuration}s`,
        "green"
      );
      if (errorCount > 0) {
        log(`✗ Failed to insert ${errorCount} questions`, "yellow");
      }
    }
  } catch (error) {
    log("✗ An error occurred:", "red");
    console.error(error);
    throw error;
  }
}

/**
 * Parse and seed a quiz from markdown file
 * @param filePath Path to the markdown file
 * @param cleanFirst Whether to clean relevant topic data before seeding
 * @param topicId Optional specific topic ID for the quiz questions
 */
export async function seedQuiz(
  filePath: string,
  cleanFirst: boolean = false,
  topicId?: number
): Promise<void> {
  try {
    log(`Starting database seeding for quiz: ${filePath}`, "cyan");

    // Add overall timing
    const totalStartTime = Date.now();

    // Parse the quiz file
    log(`Parsing quiz file: ${filePath}`, "blue");
    const questions = parseQuizDocument(filePath, {
      isFilePath: true,
    });

    // If topicId is provided, override the parsed topicId
    if (topicId) {
      questions.forEach((q) => (q.topicId = topicId));
    }

    // Clean the database for the specific topic if requested
    if (cleanFirst) {
      // Use the first question's topic ID if not explicitly provided
      const cleanTopicId =
        topicId || (questions.length > 0 ? questions[0].topicId : undefined);

      if (cleanTopicId) {
        log(
          `Cleaning database for topic ID ${cleanTopicId} before seeding...`,
          "blue"
        );
        await cleanDatabase(false, cleanTopicId); // Use our existing function
        log("✅ Topic data cleaned", "green");
      } else {
        log("Cleaning database before seeding...", "blue");
        await cleanDatabase(true); // Silent mode, clean everything
        log("✅ Database cleaned", "green");
      }
    }

    // Map the questions to ParsedQuestion format
    const parsedQuestions: ParsedQuestion[] = questions.map((q: any) => ({
      question: q.question,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex,
      correctAnswerIndices: q.correctAnswerIndices,
      hasMultipleCorrectAnswers: q.hasMultipleCorrectAnswers,
      explanation: q.explanation || "",
      topic: getTopic(q.topicId),
      topicId: q.topicId,
      difficulty: q.difficulty as any,
      source: q.source,
    }));

    log(`Parsed ${parsedQuestions.length} questions from quiz`, "blue");

    // Display summary of parsed questions for verification
    displayQuestionsSummary(parsedQuestions);

    // Seed the database with the parsed questions
    let successCount = 0;
    let errorCount = 0;

    for (const q of parsedQuestions) {
      try {
        await insertNewQuestionToDatabase(q);
        successCount++;
      } catch (error) {
        log(
          `✗ Error inserting question: ${q.question.substring(0, 50)}...`,
          "red"
        );
        console.error(error);
        errorCount++;
      }
    }

    const totalEndTime = Date.now();
    const totalDuration = ((totalEndTime - totalStartTime) / 1000).toFixed(2);

    log(
      `✓ Successfully inserted ${successCount} questions from quiz in ${totalDuration}s`,
      "green"
    );
    if (errorCount > 0) {
      log(`✗ Failed to insert ${errorCount} questions from quiz`, "yellow");
    }

    log(`✓ Quiz seeding completed successfully`, "green");
  } catch (error) {
    log(`✗ Error seeding quiz:`, "red");
    console.error(error);
    throw error;
  }
}

/**
 * Run the complete workflow: clean → seed
 */
export async function runWorkflow(): Promise<void> {
  try {
    log("Starting Comprehensive Database Setup Workflow", "cyan");

    // Step 1: Clean the database
    log("\n1. Cleaning the database", "bright");
    await cleanDatabase();

    // Step 2: Seed all required data (topics, users, questions)
    log("\n2. Seeding the database (topics, users, and questions)", "bright");
    const quizzesDir = path.join(process.cwd(), "quizzes");
    await seedDatabase(quizzesDir, false); // Don't clean again

    // Step 3: Check questions in database
    log("\n3. Checking seeded questions", "bright");
    await checkQuestions();

    log("\n✓ Workflow completed successfully!", "green");
    log(
      "Database is now fully initialized with topics, users, and questions.",
      "bright"
    );
  } catch (error) {
    log("\n✗ Workflow failed:", "yellow");
    console.error(error);
    process.exit(1);
  }
}

/**
 * Main function to seed multiple quizzes in one go
 * @param quizFilePaths Array of paths to quiz files to process
 * @param cleanFirst Whether to clean the database before seeding
 */
export async function seedMultipleQuizzes(
  quizFilePaths: string[] = [],
  cleanFirst: boolean = true
): Promise<void> {
  try {
    // If no files provided, use default ones
    const filesToProcess =
      quizFilePaths.length > 0
        ? quizFilePaths
        : [
            "quizzes/cloudinary-user-role-management-quiz.md",
            "quizzes/cloudinary-transformations-quiz.md",
          ];

    log("Starting Multiple Quizzes Seeding Process", "bright");
    log("=============================================", "yellow");

    // Step 1: Clean the database if requested
    if (cleanFirst) {
      log("\n1. Cleaning the database", "blue");
      await cleanDatabase(true);
      log("✅ Database cleaned", "green");
    }

    // Step 2: Seed topics
    log("\n2. Seeding topics", "blue");
    await seedTopics();
    log("✅ Topics seeded", "green");

    // Step 3: Create test user
    log("\n3. Creating test user", "blue");
    await createTestUser();
    log("✅ Test user created", "green");

    // Step 4: Process each quiz file
    log("\n4. Processing quiz files", "blue");

    let totalQuestions = 0;
    let totalSuccessCount = 0;
    let totalErrorCount = 0;

    // Keep track of the time
    const startTime = Date.now();

    for (let i = 0; i < filesToProcess.length; i++) {
      const quizFile = filesToProcess[i];
      const quizFilePath = path.join(process.cwd(), quizFile);

      // Display progress as a percentage and file count
      const progress = Math.round((i / filesToProcess.length) * 100);
      log("=============================================", "yellow");
      log(
        `Processing file ${i + 1} of ${
          filesToProcess.length
        } (${progress}% complete)`,
        "bright"
      );
      log(`Quiz file: ${quizFile}`, "cyan");

      // Check if file exists
      if (!fs.existsSync(quizFilePath)) {
        log(`⚠️ File not found: ${quizFilePath}`, "yellow");
        continue;
      }

      try {
        // Parse the quiz file
        log(`📝 Parsing quiz file...`, "blue");
        const fileStartTime = Date.now();
        const parsedQuestions = parseMarkdownQuiz(quizFilePath);

        // Calculate file metadata
        const fileStats = fs.statSync(quizFilePath);
        const fileSizeKB = Math.round(fileStats.size / 1024);
        const fileName = path.basename(quizFilePath);

        log(
          `✓ Parsed ${parsedQuestions.length} questions from ${fileName} (${fileSizeKB}KB)`,
          "green"
        );

        // Display a summary of question topics and difficulty
        const difficultyCount: Record<string, number> = {
          easy: 0,
          medium: 0,
          hard: 0,
        };

        const topicCount: Record<string, number> = {};

        for (const q of parsedQuestions) {
          const difficulty = q.difficulty || "medium";
          difficultyCount[difficulty as keyof typeof difficultyCount] =
            (difficultyCount[difficulty as keyof typeof difficultyCount] || 0) +
            1;

          const topic = q.topic || "General";
          if (!topicCount[topic]) {
            topicCount[topic] = 0;
          }
          topicCount[topic]++;
        }

        log(`📊 Quiz composition:`, "blue");
        log(
          `   - Difficulty: ${difficultyCount.easy} easy, ${difficultyCount.medium} medium, ${difficultyCount.hard} hard`,
          "blue"
        );

        for (const [topic, count] of Object.entries(topicCount)) {
          log(`   - Topic "${topic}": ${count} questions`, "blue");
        }

        // Insert questions into database
        log(`💾 Inserting questions into database...`, "blue");
        let successCount = 0;
        let errorCount = 0;

        for (const q of parsedQuestions) {
          try {
            await insertNewQuestionToDatabase(q);
            successCount++;
            totalSuccessCount++;
          } catch (error) {
            log(
              `✗ Error inserting question: ${q.question.substring(0, 50)}...`,
              "red"
            );
            console.error(error);
            errorCount++;
            totalErrorCount++;
          }
        }

        totalQuestions += parsedQuestions.length;

        // Calculate processing time
        const fileEndTime = Date.now();
        const fileProcessingTime = (
          (fileEndTime - fileStartTime) /
          1000
        ).toFixed(2);

        log(
          `✓ Successfully inserted ${successCount} questions in ${fileProcessingTime}s`,
          "green"
        );
        if (errorCount > 0) {
          log(`⚠️ Failed to insert ${errorCount} questions`, "yellow");
        }
      } catch (error) {
        log(`❌ Error processing file ${quizFile}:`, "red");
        console.error(error);
      }
    }

    // Calculate total processing time
    const endTime = Date.now();
    const totalProcessingTime = ((endTime - startTime) / 1000).toFixed(2);

    // Display final summary
    log("=============================================", "yellow");
    log(`📋 Final Summary:`, "bright");
    log(`✓ Processed ${filesToProcess.length} quiz files`, "green");
    log(`✓ Total questions processed: ${totalQuestions}`, "green");
    log(`✓ Successfully inserted: ${totalSuccessCount} questions`, "green");
    if (totalErrorCount > 0) {
      log(`⚠️ Failed to insert: ${totalErrorCount} questions`, "yellow");
    }
    log(`⏱️ Total processing time: ${totalProcessingTime} seconds`, "bright");
    log("=============================================", "yellow");

    log("\n✅ Database seeding completed successfully!", "bright");
  } catch (error) {
    log("\n❌ An error occurred during seeding:", "red");
    console.error(error);
  }
}

/**
 * Command-line interface runner for quiz seeding
 * Use this as the main entry point for seeding quizzes via CLI
 */
export async function runQuizSeeder(): Promise<void> {
  try {
    // Display a title
    console.log("Running Quiz Seeder!"); // Simple logging to debug
    log("=================================================", "bright");
    log("           CLOUDINARY QUIZ SEEDER                ", "bright");
    log("=================================================", "bright");

    // Default quiz files to process
    const DEFAULT_QUIZ_FILES = [
      "quizzes/cloudinary-user-role-management-quiz.md",
      "quizzes/cloudinary-transformations-quiz.md",
    ];

    // Parse command line arguments
    let quizFiles = DEFAULT_QUIZ_FILES;
    let cleanFirst = true;
    let shouldCheckQuestions = true;

    // Check if specific quiz files were provided as arguments
    const args = process.argv.slice(2);
    if (args.length > 0) {
      // Filter out flags
      const fileArgs = args.filter((arg) => !arg.startsWith("--"));
      if (fileArgs.length > 0) {
        quizFiles = fileArgs;
      }

      // Check for --no-clean flag
      if (args.includes("--no-clean")) {
        cleanFirst = false;
      }

      // Check for --no-check flag
      if (args.includes("--no-check")) {
        shouldCheckQuestions = false;
      }
    }

    // Log the configuration
    log("Configuration:", "yellow");
    log("- Quiz files to process:", "blue");
    quizFiles.forEach((file) => log(`  - ${file}`, "blue"));
    log(
      `- Clean database before seeding: ${cleanFirst ? "Yes" : "No"}`,
      "blue"
    );
    log(
      `- Check questions after seeding: ${shouldCheckQuestions ? "Yes" : "No"}`,
      "blue"
    );
    log("");

    // Run the seeder
    await seedMultipleQuizzes(quizFiles, cleanFirst);

    // Check questions if requested
    if (shouldCheckQuestions) {
      log("\n📊 Checking seeded questions:", "bright");
      await checkQuestions();
    }

    // Ensure we exit cleanly
    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    log("\n❌ Fatal error:", "red");
    console.error(error);
    if (require.main === module) {
      process.exit(1);
    }
  }
}

// If this file is run directly, execute the quiz seeder
if (require.main === module) {
  runQuizSeeder()
    .catch((error) => {
      console.error("Unhandled error:", error);
      process.exit(1);
    })
    .finally(() => {
      // Ensure the process exits
      process.exit(0);
    });
}

import path from "path";
import fs from "fs";
import { log } from "./utils";
import { cleanDatabase } from "./clean";
import { seedDatabase, seedQuiz, runWorkflow } from "./quiz-seeder";

/**
 * Display help information
 */
export function showHelp(): void {
  log("\nCloudinary Quiz Database Manager", "bright");
  log(
    "\nUsage: npx tsx lib/db/scripts/quiz-manager.ts [command] [options]",
    "bright"
  );
  log("\nCommands:", "bright");
  log("  clean              Clean the database", "dim");
  log(
    "  seed [path]        Seed from markdown files at path (default: quizzes/)",
    "dim"
  );
  log("  seed-quiz [path]    Seed from quiz-specific markdown format", "dim");
  log("  workflow           Run the complete workflow (clean → seed)", "dim");
  log("  help               Show this help information", "dim");
  log("\nOptions:", "bright");
  log(
    "  --clean            Clean the database before seeding (for seed commands)",
    "dim"
  );
  log(
    "  --topic=<id>       Override topic ID for questions (for seed-quiz command)",
    "dim"
  );

  log("\nExamples:", "bright");
  log("  npx tsx lib/db/scripts/quiz-manager.ts clean", "dim");
  log("  npx tsx lib/db/scripts/quiz-manager.ts seed quizzes/", "dim");
  log(
    "  npx tsx lib/db/scripts/quiz-manager.ts seed-quiz quizzes/sample-quiz.md",
    "dim"
  );
  log("  npx tsx lib/db/scripts/quiz-manager.ts workflow", "dim");
}

/**
 * Process command line arguments and execute the appropriate command
 */
export async function processCommands(): Promise<void> {
  try {
    const args = process.argv.slice(2);
    const command = args[0]?.toLowerCase() || "help";
    const shouldClean = args.includes("--clean");

    // At the beginning, show what we're about to do
    log(
      `Running command: ${command}${shouldClean ? " with --clean flag" : ""}`,
      "bright"
    );

    switch (command) {
      case "clean":
        await cleanDatabase();
        log("✓ Database cleaning completed successfully", "green");
        break;

      case "seed":
        const sourcePath =
          args.find((arg) => arg !== command && !arg.startsWith("--")) ||
          path.join(process.cwd(), "quizzes");

        if (!fs.existsSync(sourcePath)) {
          log(`❌ Error: Path not found: ${sourcePath}`, "red");
          process.exit(1);
        }

        await seedDatabase(sourcePath, shouldClean);
        log(`✓ Database seeding from markdown completed successfully`, "green");
        break;

      case "seed-quiz":
        const quizPath = args.find(
          (arg) => arg !== command && !arg.startsWith("--")
        );

        if (!quizPath || !fs.existsSync(quizPath)) {
          log("❌ Error: Please specify a valid quiz file path", "red");
          process.exit(1);
        }

        const topicIdArg = args.find((arg) => arg.startsWith("--topic="));
        let topicId: number | undefined = undefined;
        if (topicIdArg) {
          const topicIdStr = topicIdArg.replace("--topic=", "");
          topicId = parseInt(topicIdStr);
          if (isNaN(topicId)) {
            log("❌ Error: Invalid topic ID format", "red");
            process.exit(1);
          }
        }

        await seedQuiz(quizPath, shouldClean, topicId);
        log("✓ Quiz seeding completed successfully", "green");
        break;

      case "workflow":
        await runWorkflow();
        break;

      case "help":
      default:
        showHelp();
        break;
    }
  } catch (error) {
    log("✗ An error occurred:", "red");
    console.error(error);
    process.exit(1);
  }
}

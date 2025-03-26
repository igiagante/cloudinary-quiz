# Database Seeding Guide

This guide explains the various methods for seeding the Cloudinary Quiz database, including how to work with different file formats and use the specialized tools available.

## Seeding Options Overview

| Method            | Command                                                                   | Use Case                                                |
| ----------------- | ------------------------------------------------------------------------- | ------------------------------------------------------- |
| Clean DB          | `npx tsx lib/db/scripts/quiz-manager.ts clean`                            | Remove all questions and related data                   |
| Seed All Markdown | `npx tsx lib/db/scripts/quiz-manager.ts seed-markdown`                    | Import all quiz files in the `/quizzes` directory       |
| Seed Single File  | `npx tsx lib/db/scripts/seed-single-file.ts <file-path>`                  | Import a specific markdown file with duplicate checking |
| Seed From JSON    | `npx tsx lib/db/scripts/quiz-manager.ts seed-json <file-path>`            | Import questions from a JSON file                       |
| Test Parser       | `npx tsx lib/db/scripts/test-quizzes/test-markdown-parser.ts <file-path>` | Test parsing a specific markdown file                   |

## File Formats

### Markdown Quiz Files (`.md`)

Markdown files in the `/quizzes` directory contain formatted quiz questions. These are parsed using the `parseMarkdownQuiz` function.

Example workflow:

```bash
# Clean the database first (optional)
npx tsx lib/db/scripts/quiz-manager.ts clean

# Seed with a specific markdown file
npx tsx lib/db/scripts/seed-single-file.ts quizzes/cloudinary-comprehensive-quiz.md

# Or use the npm script
npm run db:seed-file quizzes/cloudinary-comprehensive-quiz.md
```

### JSON Files

The application works with two primary JSON file formats:

1. **claude-questions.json**:

   - Located in `/data` directory
   - Generated from markdown files by the parser
   - Contains raw question data exported from the parser
   - Used as an intermediate format for bulk processing

2. **questions-for-db.json**:
   - Contains questions in a format ready for database insertion
   - Has database-specific fields and structure
   - Used for direct database imports

## Tools and Utilities

### `seed-single-file.ts`

This script imports questions from a single markdown file while checking for duplicates:

- Verifies that questions don't already exist in the database
- Provides detailed reporting on questions added/skipped
- Ideal for incremental additions to the database

Usage:

```bash
npx tsx lib/db/scripts/seed-single-file.ts quizzes/cloudinary-comprehensive-quiz.md

# Or use the npm script
npm run db:seed-file quizzes/cloudinary-comprehensive-quiz.md
```

Benefits:

- Prevents duplicate questions
- Gives detailed progress feedback
- Safely rerunnable (idempotent)

### `quiz-manager.ts`

The main utility for managing the quiz database:

```bash
# Available commands
npx tsx lib/db/scripts/quiz-manager.ts clean          # Clean the database
npx tsx lib/db/scripts/quiz-manager.ts parse          # Parse markdown files to JSON
npx tsx lib/db/scripts/quiz-manager.ts seed-json      # Seed from JSON file
npx tsx lib/db/scripts/quiz-manager.ts seed-markdown  # Seed from all markdown files
npx tsx lib/db/scripts/quiz-manager.ts workflow       # Run the complete workflow
```

Note: The `seed-markdown` command will process all markdown files in the `/quizzes` directory. It does not check for duplicates.

### `test-markdown-parser.ts`

This utility helps test parsing of markdown files:

- Parses a markdown file and displays stats about the questions
- Highlights issues like missing options
- Can optionally clean and seed the database with the parsed questions
- Provides detailed debugging for problematic questions

Usage:

```bash
npx tsx lib/db/scripts/test-quizzes/test-markdown-parser.ts path/to/your-quiz.md
```

Use this tool when:

- Creating a new markdown quiz file
- Debugging parsing issues
- Validating markdown format

## Recommended Workflows

### Initial Setup

For a fresh database:

```bash
# Clean the database
npx tsx lib/db/scripts/quiz-manager.ts clean

# Seed with a specific file
npx tsx lib/db/scripts/seed-single-file.ts quizzes/cloudinary-comprehensive-quiz.md
```

### Adding New Questions

When adding new quiz files:

```bash
# Test the parser first
npx tsx lib/db/scripts/test-quizzes/test-markdown-parser.ts path/to/new-quiz.md

# Once validated, seed with the new file
npm run db:seed-file path/to/new-quiz.md
```

### Migrating from Other Sources

If you have questions in other formats:

1. Convert to markdown format
2. Test with the parser
3. Seed with `seed-single-file.ts`

## Troubleshooting

### Common Issues

1. **Duplicate Questions**: Use `seed-single-file.ts` to prevent duplicates
2. **Parsing Errors**: Use `test-markdown-parser.ts` to debug markdown format
3. **Missing Options**: Ensure each question has exactly 4 options

### Tips for Creating Markdown Questions

- Each question should be numbered (e.g., **1.**)
- Options should use the format: `- A) Option text`
- Mark the correct answers in an "Answers" section at the end
- Use section headers (##) to group questions by topic

# Quiz Markdown Parser Guide

This guide explains how the quiz markdown parser system works and how to handle different markdown formatting styles in quiz files.

## Problem Statement

Our application needs to parse quiz questions from markdown files, but we've encountered files with different formatting styles:

1. **Standard Format**: Questions with options marked by hyphens

   ```markdown
   **1. Question text?**

   - A) First option
   - B) Second option
   - C) Third option
   - D) Fourth option
   ```

2. **Alternative Format**: Questions with options without hyphens

   ```markdown
   **1. Question text?**

   A) First option
   B) Second option
   C) Third option
   D) Fourth option
   ```

## Solution: Multi-Parser System

We've implemented a smart multi-parser system that:

1. Analyzes quiz file formats
2. Determines which parser to use for each file
3. Applies the appropriate parser automatically

## Parser Components

### 1. Standard Parser (`quiz-markdown-parser.ts`)

- Default parser that handles markdown with hyphenated options
- Uses regex patterns to extract questions, options, and correct answers
- Works well with files like `cloudinary-comprehensive-quiz.md`

### 2. Alternative Parser (`multi-parser.ts` > `parseQuizFormat`)

- Handles markdown with direct option format (no hyphens)
- Parses questions and options differently than the standard parser
- Works well with files like `cloudinary-architecture-quiz.md`

### 3. Smart Multi-Parser (`multi-parser.ts` > `smartParseMarkdownQuiz`)

- Determines which parser to use based on the file name
- Contains a list of files that need the alternative parser
- Automatically routes to the appropriate parser

## Testing and Validation

We've included several scripts to test and validate parser functionality:

- `npm run db:test-parser`: Tests the standard parser on a file
- `npm run db:test-both`: Tests both parsers on a specific file
- `npm run db:test-all`: Tests all quiz files and determines the best parser for each
- `npm run db:test-multi`: Tests the smart multi-parser on all files

## How to Add New Quiz Files

When adding a new quiz file, follow these steps:

1. Create your markdown file in the `quizzes` directory
2. Run the test script to determine which parser works best:
   ```bash
   npm run db:test-both -- quizzes/your-new-quiz.md
   ```
3. If the alternative parser is needed, add the filename to the `ALTERNATIVE_PARSER_FILES` array in `lib/db/parser/multi-parser.ts`:
   ```typescript
   const ALTERNATIVE_PARSER_FILES = [
     // existing files
     "your-new-quiz.md",
   ];
   ```
4. Test the multi-parser with your new file:
   ```bash
   npm run db:test-multi -- quizzes/your-new-quiz.md
   ```
5. Run the database seeding process to add your questions:
   ```bash
   npm run db:setup
   ```

## Troubleshooting

If you encounter issues with parsing:

1. Check the markdown formatting in your quiz file
2. Ensure question formats are consistent
3. Run the test scripts to identify parsing issues
4. Consider modifying the parsers if you have a new format to support

## Parser Modification

If you need to modify the parsers:

1. Make changes to `lib/db/parser/quiz-markdown-parser.ts` for the standard parser
2. Make changes to `lib/db/parser/multi-parser.ts` for the alternative parser
3. Test your changes with the test scripts
4. Update this documentation if the parsing logic changes significantly

## Success Criteria

A successful parse will result in:

- All questions correctly identified
- All options extracted for each question
- Appropriate topic and difficulty assignments
- Questions ready for database insertion

For any questions or issues, please contact the development team.

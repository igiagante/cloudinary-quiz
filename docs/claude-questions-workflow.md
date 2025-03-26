# Cloudinary Quiz - Claude Questions Workflow

This document describes the workflow for exporting Claude-generated quiz questions to JSON and importing them back into the database.

## Background

When seeding the database with Claude-generated questions, connection issues with PostgreSQL can occur. This workflow provides a two-step process that allows:

1. Exporting questions to a JSON file (which doesn't require a database connection)
2. Later importing those questions when the database is available

## Available Scripts

The following npm scripts have been added to `package.json`:

```bash
# Export Claude quiz questions to a JSON file
npm run export-claude

# Import the exported questions into the database
npm run db:seed-from-json
```

## Workflow Steps

### 1. Export Questions to JSON

Running `npm run export-claude` will:

1. Parse all markdown quizzes in the `quizzes` directory
2. Extract all Claude-generated questions
3. Format them appropriately
4. Save them to `data/claude-questions.json`

This process does not require a database connection.

### 2. Import Questions from JSON

When your database is available and properly configured, running `npm run db:seed-from-json` will:

1. Read the questions from the JSON file
2. Insert them into your PostgreSQL database

This allows you to separate the extraction process from the database insertion process.

## Implementation Details

### Export Script (`lib/export-claude-questions.ts`)

This script reads quiz markdown files, extracts questions, and exports them to JSON:

```typescript
// Key functions:
function mapToCloudinaryTopic(topic: string): string {
  // Maps parsed topics to Cloudinary topic enum values
  // ...
}

async function main() {
  // Parse quizzes from the quizzes directory
  const quizzesDir = path.join(process.cwd(), "quizzes");
  const parsedQuestions = parseAllQuizzes(quizzesDir);

  // Format and save questions to JSON
  // ...
}
```

### Import Script (`lib/db/seed-from-json.ts`)

This script reads the JSON file and inserts questions into the database:

```typescript
async function main() {
  // Read JSON file
  const jsonPath = path.join(process.cwd(), "data", "claude-questions.json");
  const jsonData = fs.readFileSync(jsonPath, "utf8");
  const parsedQuestions = JSON.parse(jsonData) as QuizQuestion[];

  // Insert into database
  const result = await db.insert(questions).values(parsedQuestions);
}
```

## Common Issues

- Make sure the `data` directory exists before running the export script
- Ensure your database connection is properly configured before running the import script
- If you encounter type errors, check that the exported JSON structure matches the expected database schema

## Conclusion

This workflow provides a reliable way to handle the Claude questions without being dependent on a continuous database connection during the export process. The two-step approach allows for more flexibility and resilience in your development workflow.

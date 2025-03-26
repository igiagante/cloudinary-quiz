# Cloudinary Quiz Database Manager Documentation

The Cloudinary Quiz Database Manager is a command-line tool for managing quiz questions in the database. It provides functionality for cleaning the database, seeding questions from markdown files, and running complete workflows.

## Basic Usage

```
npx tsx lib/db/scripts/quiz-manager.ts [command] [options]
```

## Commands

| Command            | Description                                                                         |
| ------------------ | ----------------------------------------------------------------------------------- |
| `clean`            | Clean the database (removes all quiz questions and related data)                    |
| `seed [path]`      | Seed questions from markdown files at the specified path (defaults to `quizzes/`)   |
| `seed-quiz [path]` | Seed questions from a specific quiz markdown file                                   |
| `seed-topics`      | Seed topic data from topics.md                                                      |
| `workflow`         | Run the complete workflow (clean → seed topics → create test user → seed questions) |
| `help`             | Display help information                                                            |

## Options

| Option         | Description                                                                          |
| -------------- | ------------------------------------------------------------------------------------ |
| `--clean`      | Clean the database before seeding (can be used with `seed` and `seed-quiz` commands) |
| `--topic=<id>` | Override the topic ID for all questions (can be used with `seed-quiz` command)       |

## Examples

### Clean the Database

Remove all quiz questions and related data:

```
npx tsx lib/db/scripts/quiz-manager.ts clean
```

### Seed from Markdown Files

Seed questions from all markdown files in the default location:

```
npx tsx lib/db/scripts/quiz-manager.ts seed
```

Seed questions from markdown files in a specific directory:

```
npx tsx lib/db/scripts/quiz-manager.ts seed path/to/quiz/files
```

Clean the database before seeding:

```
npx tsx lib/db/scripts/quiz-manager.ts seed --clean
```

### Seed from a Specific Quiz File

Seed questions from a specific quiz file:

```
npx tsx lib/db/scripts/quiz-manager.ts seed-quiz quizzes/architecture-quiz.md
```

Override the topic ID for all questions in the file:

```
npx tsx lib/db/scripts/quiz-manager.ts seed-quiz quizzes/architecture-quiz.md --topic=3
```

### Run the Complete Workflow

Clean the database and seed it with topics, a test user, and questions:

```
npx tsx lib/db/scripts/quiz-manager.ts workflow
```

## Topic IDs

When using the `--topic` flag, you can specify one of these topic IDs:

1. Products & Value
2. Architecture
3. Media Lifecycle
4. Integrations
5. Upload & Transformations
6. Transformations
7. Media Management
8. User Management

## Architecture

The quiz management system has been refactored into a modular structure:

- **quiz-manager.ts**: Main entry point that coordinates the modules
- **modules/**: Directory containing the modular components:
  - **db.ts**: Database connection and configuration
  - **clean.ts**: Database cleaning functionality
  - **topic-manager.ts**: Topic management functionality
  - **user-manager.ts**: User management functionality
  - **quiz-seeder.ts**: Quiz seeding functionality
  - **utils.ts**: Common utilities and helper functions
  - **cli.ts**: Command line interface processing

This modular approach makes the codebase more maintainable, testable, and extensible.

## Notes

- The database connection is configured using environment variables from `.env.local`
- When seeding from markdown files, the tool will parse and validate questions before inserting them
- Topic IDs correspond to specific certification exam topics as listed above

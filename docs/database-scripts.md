# Database Scripts

This directory contains TypeScript scripts for managing the Cloudinary Quiz database.

## Consolidated Script: `quiz-manager.ts`

The `quiz-manager.ts` script provides a comprehensive solution for managing quiz questions in the database. It combines all functionality from the previously separate scripts into a single, easy-to-use command-line interface.

### Features

- Parsing markdown quiz files into JSON
- Cleaning the database
- Seeding the database from JSON or markdown files
- Running complete workflows with a single command
- Colorized console output

### Usage

```bash
npx tsx lib/db/scripts/quiz-manager.ts [command] [options]
```

### Commands

- `clean`: Clean the database by removing all quiz-related data
- `parse`: Parse markdown files to JSON
- `seed-json [path]`: Seed from JSON file (default: data/questions-for-db.json)
- `seed-markdown`: Seed from markdown files
- `workflow`: Run the complete workflow (parse → clean → seed)
- `help`: Show help information

### Options

- `--clean`: Clean the database before seeding (for seed commands)

### Examples

```bash
# Clean the database
npx tsx lib/db/scripts/quiz-manager.ts clean

# Parse markdown files to JSON
npx tsx lib/db/scripts/quiz-manager.ts parse

# Seed from JSON without cleaning
npx tsx lib/db/scripts/quiz-manager.ts seed-json

# Seed from JSON with cleaning first
npx tsx lib/db/scripts/quiz-manager.ts seed-json --clean

# Seed from JSON with custom path
npx tsx lib/db/scripts/quiz-manager.ts seed-json path/to/custom.json

# Seed from markdown files
npx tsx lib/db/scripts/quiz-manager.ts seed-markdown

# Run the complete workflow
npx tsx lib/db/scripts/quiz-manager.ts workflow

# Show help
npx tsx lib/db/scripts/quiz-manager.ts help
```

## Integration with package.json Scripts

The following npm scripts are available for database operations:

```bash
npm run db:clean            # Clean the database
npm run db:seed-json        # Seed from JSON
npm run db:seed-markdown    # Seed from markdown files
npm run db:seed-claude      # Same as db:seed-markdown (for backward compatibility)
npm run db:seed-claude-clean # Same as db:seed-markdown --clean
npm run export-claude       # Parse markdown files to JSON
npm run parse-and-seed      # Run the complete workflow
```

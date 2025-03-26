#!/bin/bash ; npx tsx lib/db/scripts/modules/quiz-seeder.ts "$@" | grep -v "Question"

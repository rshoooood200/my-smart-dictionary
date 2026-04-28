---
Task ID: 1
Agent: Main Agent
Task: Setup "My Smart Dictionary" project and fix two bugs

Work Log:
- Cloned GitHub repo from https://github.com/rshoooood200/my-smart-dictionary
- Copied all source files, API routes, components, store, lib, contexts to the project
- Adapted Prisma schema from PostgreSQL to SQLite for compatibility
- Pushed schema to database with `bun run db:push`
- Installed all dependencies successfully
- Fixed Bug 1: Sentence generation with Arabic translation in add-word-dialog-local.tsx
  - Changed example state from simple strings to SentencePair objects {en, ar}
  - Updated handleGenerateInfo to extract both sentence and translation from AI response
  - Updated UI to show paired English/Arabic inputs for each example
  - Updated handleSubmit to pass sentences array with translations to addWord
- Fixed Bug 2: "All" filter not showing words in vocabulary-app.tsx
  - Added `selectedCategory !== 'all'` check to the filter condition
  - Added `selectedLevel !== 'all'` check to the filter condition
- Added missing `importData` function to vocab-store.ts
- Cleaned up db.ts to work properly with SQLite
- Started dev server successfully, lint passes

Stage Summary:
- Both bugs fixed successfully
- Project runs on SQLite instead of PostgreSQL
- Dev server running at localhost:3000
- All API routes and components intact

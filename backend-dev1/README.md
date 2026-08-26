

This is the hackathon MVP service for MergeMind. It listens for pull request events from GitHub, grabs the diff, saves the PR to the database, runs a compact built-in analyzer, and optionally posts a review back to the PR.

## What it does

1. GitHub fires a webhook when a PR is opened or updated
2. Verify the signature to confirm it's actually from GitHub
3. Pull the full code diff using the GitHub App token
4. Save the PR record to the database
5. Run the built-in analyzer, or forward to `REVIEW_ENGINE_URL` if configured

## Stack

- Node.js + TypeScript
- Express
- Prisma + SQLite
- Octokit (GitHub API)
- GitHub App authentication
- Built-in diff analyzer
- Static dashboard API

## Setup
```bash
npm install
npm run db:generate
npm run db:push
cp .env.example .env
npm run dev
```

## Environment variables
```env
GITHUB_APP_ID=your-app-id
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
...your .pem contents...
-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET=your-webhook-secret
PORT=3001
DATABASE_URL="file:./mergemind.db"
INTERNAL_SECRET=mergemind-shared-secret-2024
```

## Scripts
```bash
npm run dev          # start with hot reload
npm run build        # compile TypeScript
npm run db:push      # sync schema to database
npm run db:studio    # visual DB browser at localhost:5555
```

## Project structure
```
src/
├── index.ts
├── webhook/
│   ├── webhookRouter.ts
│   ├── verifySignature.ts
│   ├── prEventHandler.ts
│   └── reviewEngineClient.ts
├── github/
│   ├── githubApp.ts
│   ├── diffFetcher.ts
│   └── commentPoster.ts
└── utils/
    └── errorHandler.ts
```

## What to share with backend-dev2

- `GITHUB_APP_ID` and `GITHUB_APP_PRIVATE_KEY`
- `INTERNAL_SECRET`
- `src/github/commentPoster.ts`
- `prisma/schema.prisma`

If another team owns the review engine later, set `REVIEW_ENGINE_URL`. Otherwise leave it blank and this service will use the built-in analyzer.

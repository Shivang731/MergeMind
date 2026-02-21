

This is the intake layer for MergeMind. It listens for pull request events from GitHub, grabs the diff, saves the PR to the database, and hands everything off to the review engine (backend-dev2).

## What it does

1. GitHub fires a webhook when a PR is opened or updated
2. Verify the signature to confirm it's actually from GitHub
3. Pull the full code diff using the GitHub App token
4. Save the PR record to the database
5. Forward everything to backend-dev2 via POST /review/analyze

## Stack

- Node.js + TypeScript
- Express
- Prisma + SQLite
- Octokit (GitHub API)
- GitHub App authentication

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
REVIEW_ENGINE_URL=http://localhost:3002
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

Their server runs on port 3002 and exposes POST /review/analyze.

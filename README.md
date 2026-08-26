

# MergeMind

MergeMind is a GitHub App that automatically reviews pull requests using Claude AI. When a developer opens a PR, MergeMind scans the diff for security vulnerabilities, bugs, missing tests, and code quality issues — then posts a detailed review comment directly on the PR before any human has to look at it.

If the code has critical issues, it flags the PR and tells the developer to fix them first. If everything looks clean, it tags the maintainer and tells them it's ready to review.

## How it works
```
Developer opens PR
       ↓
GitHub fires webhook → backend-dev1
       ↓
Fetch the diff from GitHub API
       ↓
Built-in MVP analyzer reviews the diff
       ↓
Review comment posted on the PR
```

## What it catches

- SQL injection, XSS, hardcoded secrets, broken auth
- Null reference errors, unhandled promise rejections, race conditions
- Missing test coverage for new functions and endpoints
- Functions that are too long, deep nesting, magic numbers, dead code
- PRs that break existing patterns or forget to update related files

## Project structure
```
MergeMind/
├── backend-dev1/    # GitHub App, webhook intake, diff fetching
└── root dashboard   # Static dashboard served by backend-dev1
```

## Review format

Every PR gets a health score from 0 to 100.

| Score | Label |
|---|---|
| 90–100 | ✅ Excellent |
| 70–89 | 🟡 Good — minor notes |
| 50–69 | 🟠 Needs Work |
| Below 50 | 🔴 Critical — do not merge |

## Tech stack

| Layer | Tools |
|---|---|
| Backend 1 | Node.js, TypeScript, Express, Octokit, Prisma |
| Review Engine | Built-in TypeScript heuristic analyzer |
| Database | SQLite (dev) → Postgres (prod) |
| AI | MVP analyzer now; Claude can replace `src/review/analyzer.ts` later |
| Auth | GitHub App with JWT + installation tokens |


##  Hackathon Project

## Current MVP

This checkout now runs as a compact hackathon MVP from `backend-dev1`:

- `POST /webhook` accepts GitHub pull request events.
- PR diffs are fetched with the GitHub App installation token.
- If `REVIEW_ENGINE_URL` is unset, the built-in analyzer reviews the diff.
- Reviews and issues are stored with Prisma.
- `GET /api/stats` and `GET /api/reviews` power the dashboard.
- The static dashboard is served from `http://localhost:3001/`.



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
Forward to backend-dev2
       ↓
Claude analyzes the code
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
├── backend-dev2/    # Claude integration, review engine, comment posting
└── frontend/        # Dashboard UI showing PR status and review history
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
| Backend 2 | Node.js, TypeScript, Express, Anthropic SDK |
| Database | SQLite (dev) → Postgres (prod) |
| AI | Claude (claude-sonnet-4-6) |
| Auth | GitHub App with JWT + installation tokens |


## Failed Hackathon Project


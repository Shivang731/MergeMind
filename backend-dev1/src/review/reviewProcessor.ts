import { PrismaClient } from '@prisma/client';
import { postPRComment, submitPRReview } from '../github/commentPoster';
import { ReviewEnginePayload } from '../webhook/reviewEngineClient';
import { analyzeDiff } from './analyzer';

const prisma = new PrismaClient();

export async function processReview(payload: ReviewEnginePayload) {
  const analysis = analyzeDiff(payload.diffText, payload.changedFiles);

  const pullRequest = await prisma.pullRequest.upsert({
    where: { owner_repo_prNumber: { owner: payload.owner, repo: payload.repo, prNumber: payload.prNumber } },
    update: {
      title: payload.prTitle,
      author: payload.author,
      baseBranch: payload.baseBranch,
      headBranch: payload.headBranch,
      filesChanged: JSON.stringify(payload.changedFiles),
      status: analysis.status,
    },
    create: {
      prNumber: payload.prNumber,
      owner: payload.owner,
      repo: payload.repo,
      title: payload.prTitle,
      author: payload.author,
      baseBranch: payload.baseBranch,
      headBranch: payload.headBranch,
      diffUrl: '',
      filesChanged: JSON.stringify(payload.changedFiles),
      status: analysis.status,
    },
  });

  const review = await prisma.review.create({
    data: {
      pullRequestId: pullRequest.id,
      commitSha: payload.commitSha,
      status: analysis.status,
      healthScore: analysis.healthScore,
      rawComment: analysis.rawComment,
      summaryText: analysis.summaryText,
      issues: {
        create: analysis.issues.map((item) => ({
          severity: item.severity,
          type: item.type,
          title: item.title,
          file: item.file,
          line: item.line,
          problem: item.problem,
          code: item.code,
          fix: item.fix,
        })),
      },
    },
    include: { issues: true },
  });

  await postGitHubReview(payload, analysis.rawComment, analysis.status);
  return review;
}

async function postGitHubReview(payload: ReviewEnginePayload, body: string, status: 'PASSED' | 'FAILED'): Promise<void> {
  if (!process.env.GITHUB_APP_ID || !process.env.GITHUB_APP_PRIVATE_KEY) return;

  try {
    await submitPRReview(
      payload.installationId,
      payload.owner,
      payload.repo,
      payload.prNumber,
      payload.commitSha,
      status === 'FAILED' ? 'REQUEST_CHANGES' : 'COMMENT',
      body,
    );
  } catch (err) {
    console.warn('   Could not submit PR review, falling back to issue comment:', err);
    await postPRComment(payload.installationId, payload.owner, payload.repo, payload.prNumber, body);
  }
}

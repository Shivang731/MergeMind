import { Octokit } from '@octokit/rest';
import { getInstallationOctokit } from './githubApp';

export async function postPRComment(
  installationId: number, owner: string, repo: string, prNumber: number, body: string
): Promise<void> {
  const octokit = await getInstallationOctokit(installationId);
  await octokit.issues.createComment({ owner, repo, issue_number: prNumber, body });
  console.log(`   💬 Posted summary comment on PR #${prNumber}`);
}

export async function postInlineComment(
  installationId: number, owner: string, repo: string,
  prNumber: number, commitSha: string, filePath: string, line: number, body: string
): Promise<void> {
  const octokit = await getInstallationOctokit(installationId);
  try {
    await octokit.pulls.createReviewComment({
      owner, repo, pull_number: prNumber,
      commit_id: commitSha, path: filePath, line, side: 'RIGHT', body,
    });
    console.log(`   📌 Inline comment on ${filePath}:${line}`);
  } catch (err: any) {
    console.warn(`   ⚠️  Could not post inline comment: ${err.message}`);
  }
}

export async function submitPRReview(
  installationId: number, owner: string, repo: string,
  prNumber: number, commitSha: string,
  event: 'REQUEST_CHANGES' | 'APPROVE' | 'COMMENT', body: string
): Promise<void> {
  const octokit = await getInstallationOctokit(installationId);
  await octokit.pulls.createReview({ owner, repo, pull_number: prNumber, commit_id: commitSha, event, body });
  console.log(`   🔖 PR Review submitted: ${event}`);
}

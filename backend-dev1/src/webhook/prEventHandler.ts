import { PrismaClient } from '@prisma/client';
import { fetchPRDiff, fetchPRFiles } from '../github/diffFetcher';
import { getInstallationOctokit } from '../github/githubApp';
import { processReview } from '../review/reviewProcessor';
import { sendToReviewEngine } from './reviewEngineClient';

const prisma = new PrismaClient();

interface PRPayload {
  action: string;
  number: number;
  installation: { id: number };
  pull_request: {
    number: number;
    title: string;
    head: { sha: string; ref: string };
    base: { ref: string };
    user: { login: string };
    diff_url: string;
  };
  repository: {
    name: string;
    owner: { login: string };
  };
}

export async function handlePullRequestEvent(payload: PRPayload, action: string): Promise<void> {
  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const prNumber = payload.pull_request.number;
  const prTitle = payload.pull_request.title;
  const author = payload.pull_request.user.login;
  const baseBranch = payload.pull_request.base.ref;
  const headBranch = payload.pull_request.head.ref;
  const commitSha = payload.pull_request.head.sha;
  const installationId = payload.installation.id;

  console.log(`\n🔍 Processing PR #${prNumber}: "${prTitle}"`);
  console.log(`   Repo: ${owner}/${repo} | Author: ${author} | Action: ${action}`);

  // Save PR to DB
  let pullRequest;
  try {
    pullRequest = await prisma.pullRequest.upsert({
      where: { owner_repo_prNumber: { owner, repo, prNumber } },
      update: { status: 'SCANNING', updatedAt: new Date() },
      create: {
        prNumber, owner, repo, title: prTitle, author,
        baseBranch, headBranch,
        diffUrl: payload.pull_request.diff_url,
        filesChanged: '[]',
        status: 'SCANNING',
      },
    });
    console.log(`   ✅ PR saved to DB (id: ${pullRequest.id})`);
  } catch (err) {
    console.error('   ❌ Failed to save PR to DB:', err);
    throw err;
  }

  // Authenticate with GitHub
  let octokit;
  try {
    octokit = await getInstallationOctokit(installationId);
    console.log(`   ✅ GitHub App authenticated`);
  } catch (err) {
    console.error('   ❌ GitHub auth failed:', err);
    throw err;
  }

  // Fetch the diff
  let diffText: string;
  let changedFiles: string[];
  try {
    console.log(`   📄 Fetching diff...`);
    diffText = await fetchPRDiff(octokit, owner, repo, prNumber);
    changedFiles = await fetchPRFiles(octokit, owner, repo, prNumber);

    await prisma.pullRequest.update({
      where: { id: pullRequest.id },
      data: { filesChanged: JSON.stringify(changedFiles) },
    });

    console.log(`   ✅ Diff fetched | ${changedFiles.length} files: ${changedFiles.join(', ')}`);
  } catch (err) {
    console.error('   ❌ Failed to fetch diff:', err);
    throw err;
  }

  // Send to external review engine when configured; otherwise use the built-in MVP analyzer.
  try {
    const reviewPayload = {
      pullRequestId: pullRequest.id,
      owner, repo, prNumber, prTitle, author,
      baseBranch, headBranch, commitSha,
      diffText, changedFiles, installationId,
    };

    if (process.env.REVIEW_ENGINE_URL) {
      console.log(`   Sending to external Review Engine...`);
      await sendToReviewEngine(reviewPayload);
      console.log(`   Review Engine notified!`);
      return;
    }

    console.log(`   Running built-in MVP review...`);
    await processReview(reviewPayload);
    console.log(`   Review complete!`);
  } catch (err) {
    console.error('   Review failed:', err);
  }
}

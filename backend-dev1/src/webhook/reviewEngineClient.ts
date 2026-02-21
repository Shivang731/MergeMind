import axios from 'axios';

export interface ReviewEnginePayload {
  pullRequestId: string;
  owner: string;
  repo: string;
  prNumber: number;
  prTitle: string;
  author: string;
  baseBranch: string;
  headBranch: string;
  commitSha: string;
  diffText: string;
  changedFiles: string[];
  installationId: number;
}

export async function sendToReviewEngine(payload: ReviewEnginePayload): Promise<void> {
  const reviewEngineUrl = process.env.REVIEW_ENGINE_URL;
  if (!reviewEngineUrl) throw new Error('REVIEW_ENGINE_URL is not set');

  await axios.post(`${reviewEngineUrl}/review/analyze`, payload, {
    timeout: 60_000,
    headers: {
      'Content-Type': 'application/json',
      'X-MergeMind-Secret': process.env.INTERNAL_SECRET || 'dev-secret',
    },
  });
}

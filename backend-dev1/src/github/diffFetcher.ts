import { Octokit } from '@octokit/rest';

export async function fetchPRDiff(octokit: Octokit, owner: string, repo: string, prNumber: number): Promise<string> {
  const response = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
    owner, repo, pull_number: prNumber,
    headers: { Accept: 'application/vnd.github.v3.diff' },
  });

  const diff = response.data as unknown as string;
  const MAX = 150_000;

  if (diff.length > MAX) {
    console.warn(`   ⚠️  Diff truncated (${diff.length} chars)`);
    return diff.slice(0, MAX) + '\n\n[... DIFF TRUNCATED ...]';
  }

  return diff;
}

export async function fetchPRFiles(octokit: Octokit, owner: string, repo: string, prNumber: number): Promise<string[]> {
  const files = await octokit.paginate(octokit.pulls.listFiles, {
    owner, repo, pull_number: prNumber, per_page: 100,
  });
  return files.map((f: { filename: string }) => f.filename);
}

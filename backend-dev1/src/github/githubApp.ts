import { App } from '@octokit/app';
import { Octokit } from '@octokit/rest';

let githubApp: App | null = null;

function getApp(): App {
  if (githubApp) return githubApp;

  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!appId || !privateKey) {
    throw new Error('Missing GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY');
  }

  githubApp = new App({ appId, privateKey, webhooks: { secret: process.env.GITHUB_WEBHOOK_SECRET || '' } });
  return githubApp;
}

export async function getInstallationOctokit(installationId: number): Promise<Octokit> {
  const app = getApp();
  const octokit = await app.getInstallationOctokit(installationId);
  return octokit as unknown as Octokit;
}

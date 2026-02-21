import { Router, Request, Response } from 'express';
import { verifySignature } from './verifySignature';
import { handlePullRequestEvent } from './prEventHandler';

export const webhookRouter = Router();

webhookRouter.post('/', async (req: Request, res: Response) => {
  const signature = req.headers['x-hub-signature-256'] as string;
  const rawBody = (req as any).rawBody as Buffer;

  const isValid = verifySignature(rawBody, signature);
  if (!isValid) {
    console.warn('❌ Webhook signature verification failed');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.headers['x-github-event'] as string;
  const deliveryId = req.headers['x-github-delivery'] as string;
  const payload = req.body;

  console.log(`\n📦 Webhook received | Event: ${event} | Delivery: ${deliveryId}`);

  if (event === 'pull_request') {
    const action = payload.action;

    if (['opened', 'synchronize', 'reopened'].includes(action)) {
      res.status(202).json({ message: 'Accepted — review queued' });

      handlePullRequestEvent(payload, action).catch((err) => {
        console.error(`❌ Error processing PR event:`, err);
      });

      return;
    }

    console.log(`   Ignoring action: ${action}`);
    return res.status(200).json({ message: `Ignoring action: ${action}` });
  }

  return res.status(200).json({ message: `Ignoring event: ${event}` });
});

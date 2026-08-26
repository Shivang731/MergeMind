import { Router, Request, Response } from 'express';
import { processReview } from './reviewProcessor';

export const reviewRouter = Router();

reviewRouter.post('/analyze', async (req: Request, res: Response) => {
  const expectedSecret = process.env.INTERNAL_SECRET;
  const actualSecret = req.headers['x-mergemind-secret'];

  if (expectedSecret && actualSecret !== expectedSecret) {
    return res.status(401).json({ error: 'Invalid internal secret' });
  }

  const review = await processReview(req.body);
  return res.status(201).json({ reviewId: review.id, status: review.status, healthScore: review.healthScore });
});

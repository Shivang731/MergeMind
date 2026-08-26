import { PrismaClient } from '@prisma/client';
import { Router } from 'express';

const prisma = new PrismaClient();
export const dashboardRouter = Router();

dashboardRouter.get('/reviews', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const pullRequests = await prisma.pullRequest.findMany({
    orderBy: { updatedAt: 'desc' },
    take: limit,
    include: {
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { issues: true },
      },
    },
  });

  res.json(pullRequests.map((pullRequest) => {
    const review = pullRequest.reviews[0];
    return {
      id: pullRequest.id,
      prNumber: pullRequest.prNumber,
      repo: `${pullRequest.owner}/${pullRequest.repo}`,
      title: pullRequest.title,
      author: pullRequest.author,
      status: review?.status || pullRequest.status,
      score: review?.healthScore ?? null,
      summary: review?.summaryText || 'Review has not completed yet.',
      createdAt: (review?.createdAt || pullRequest.createdAt).toISOString(),
      issues: review?.issues || [],
    };
  }));
});

dashboardRouter.get('/stats', async (_req, res) => {
  const [total, passed, failed, reviews] = await Promise.all([
    prisma.pullRequest.count(),
    prisma.pullRequest.count({ where: { status: 'PASSED' } }),
    prisma.pullRequest.count({ where: { status: 'FAILED' } }),
    prisma.review.findMany({ select: { healthScore: true } }),
  ]);

  const avgScore = reviews.length
    ? Math.round(reviews.reduce((sum, review) => sum + review.healthScore, 0) / reviews.length)
    : null;

  res.json({ total, passed, failed, avgScore });
});

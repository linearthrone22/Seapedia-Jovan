import { Request, Response } from 'express';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import { prisma } from '../utils/prisma';

const reviewSchema = z.object({
  reviewerName: z.string().min(1).max(100),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(500),
});

const sanitize = (str: string) => sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} });

export const createReview = async (req: Request, res: Response) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { reviewerName, rating, comment } = parsed.data;

  const review = await prisma.applicationReview.create({
    data: {
      reviewerName: sanitize(reviewerName),
      rating,
      comment: sanitize(comment),
      userId: req.user?.userId ?? null,
    },
  });
  res.status(201).json(review);
};

export const getReviews = async (_req: Request, res: Response) => {
  const reviews = await prisma.applicationReview.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(reviews);
};

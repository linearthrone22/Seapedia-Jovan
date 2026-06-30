import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import sanitizeHtml from 'sanitize-html';

const storeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(''),
});

const sanitize = (str: string) => sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} });

export const createStore = async (req: Request, res: Response) => {
  const parsed = storeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { name, description } = parsed.data;

  const sellerId = req.user!.userId;

  // Check if seller already has a store
  const existingStore = await prisma.store.findUnique({ where: { sellerId } });
  if (existingStore) {
    return res.status(400).json({ error: 'You already own a storefront.' });
  }

  // Check if store name is unique
  const nameExists = await prisma.store.findUnique({ where: { name: sanitize(name) } });
  if (nameExists) {
    return res.status(409).json({ error: 'Store name is already taken.' });
  }

  const store = await prisma.store.create({
    data: {
      name: sanitize(name),
      description: sanitize(description),
      sellerId,
    },
  });

  res.status(201).json(store);
};

export const getOwnStore = async (req: Request, res: Response) => {
  const sellerId = req.user!.userId;

  const store = await prisma.store.findUnique({
    where: { sellerId },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!store) {
    return res.status(404).json({ error: 'You do not own a storefront. Please create one.' });
  }

  res.json(store);
};

export const updateStore = async (req: Request, res: Response) => {
  const parsed = storeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { name, description } = parsed.data;

  const sellerId = req.user!.userId;

  const ownStore = await prisma.store.findUnique({ where: { sellerId } });
  if (!ownStore) {
    return res.status(404).json({ error: 'Storefront not found.' });
  }

  // If changing name, check if new name is taken by another store
  const sanitizedName = sanitize(name);
  if (ownStore.name !== sanitizedName) {
    const nameExists = await prisma.store.findUnique({ where: { name: sanitizedName } });
    if (nameExists) {
      return res.status(409).json({ error: 'Store name is already taken.' });
    }
  }

  const updated = await prisma.store.update({
    where: { sellerId },
    data: {
      name: sanitizedName,
      description: sanitize(description),
    },
  });

  res.json(updated);
};

export const getPublicStore = async (req: Request, res: Response) => {
  const { id } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 9;
  const skip = (page - 1) * limit;

  const store = await prisma.store.findUnique({
    where: { id },
  });

  if (!store) {
    return res.status(404).json({ error: 'Store not found.' });
  }

  const totalProducts = await prisma.product.count({
    where: { storeId: id, isActive: true },
  });

  const products = await prisma.product.findMany({
    where: { storeId: id, isActive: true },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });

  res.json({
    store,
    products,
    pagination: {
      total: totalProducts,
      page,
      limit,
      pages: Math.ceil(totalProducts / limit),
    },
  });
};

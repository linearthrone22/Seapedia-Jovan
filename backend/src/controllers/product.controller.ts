import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import sanitizeHtml from 'sanitize-html';

const productSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional().default(''),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

const sanitize = (str: string) => sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} });

export const createProduct = async (req: Request, res: Response) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { name, description, price, stock, imageUrl } = parsed.data;

  const sellerId = req.user!.userId;

  const store = await prisma.store.findUnique({ where: { sellerId } });
  if (!store) {
    return res.status(400).json({ error: 'You must create a store before listing products.' });
  }

  const product = await prisma.product.create({
    data: {
      name: sanitize(name),
      description: sanitize(description),
      price,
      stock,
      imageUrl: imageUrl || null,
      storeId: store.id,
    },
  });

  res.status(201).json(product);
};

export const getSellerProducts = async (req: Request, res: Response) => {
  const sellerId = req.user!.userId;

  const store = await prisma.store.findUnique({ where: { sellerId } });
  if (!store) {
    return res.status(400).json({ error: 'You do not have a store setup.' });
  }

  const products = await prisma.product.findMany({
    where: { storeId: store.id, isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json(products);
};

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { name, description, price, stock, imageUrl } = parsed.data;

  const sellerId = req.user!.userId;
  const store = await prisma.store.findUnique({ where: { sellerId } });
  if (!store) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.storeId !== store.id || !product.isActive) {
    return res.status(404).json({ error: 'Product not found or deleted.' });
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      name: sanitize(name),
      description: sanitize(description),
      price,
      stock,
      imageUrl: imageUrl || null,
    },
  });

  res.json(updated);
};

export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const sellerId = req.user!.userId;
  const store = await prisma.store.findUnique({ where: { sellerId } });
  if (!store) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.storeId !== store.id || !product.isActive) {
    return res.status(404).json({ error: 'Product not found or deleted.' });
  }

  // Soft delete
  await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });

  res.json({ message: 'Product deleted successfully.' });
};

export const getPublicProducts = async (req: Request, res: Response) => {
  const search = (req.query.q as string) || '';
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 9;
  const skip = (page - 1) * limit;

  const whereClause: any = {
    isActive: true,
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { store: { name: { contains: search, mode: 'insensitive' } } },
    ],
  };

  const total = await prisma.product.count({ where: whereClause });
  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      store: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });

  res.json({
    products,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
};

export const getPublicProductDetail = async (req: Request, res: Response) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      store: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!product || !product.isActive) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  res.json(product);
};

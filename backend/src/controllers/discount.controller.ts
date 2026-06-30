import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { DiscountType } from '@prisma/client';
import sanitizeHtml from 'sanitize-html';

const voucherSchema = z.object({
  code: z.string().min(3).max(30).toUpperCase(),
  description: z.string().max(200),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().nonnegative().optional().default(0),
  maxUsage: z.number().int().positive(),
  expiresAt: z.string().datetime(),
});

const promoSchema = z.object({
  code: z.string().min(3).max(30).toUpperCase(),
  description: z.string().max(200),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().nonnegative().optional().default(0),
  expiresAt: z.string().datetime(),
});

const sanitize = (str: string) => sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} });

// Admin: Vouchers
export const createVoucher = async (req: Request, res: Response) => {
  const parsed = voucherSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const data = parsed.data;

  const existing = await prisma.voucher.findUnique({ where: { code: data.code } });
  if (existing) return res.status(409).json({ error: 'Voucher code already exists.' });

  const voucher = await prisma.voucher.create({
    data: {
      code: data.code,
      description: sanitize(data.description),
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderAmount: data.minOrderAmount,
      maxUsage: data.maxUsage,
      expiresAt: new Date(data.expiresAt),
    },
  });

  res.status(201).json(voucher);
};

export const getVouchers = async (req: Request, res: Response) => {
  const vouchers = await prisma.voucher.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(vouchers);
};

export const getVoucherDetail = async (req: Request, res: Response) => {
  const { id } = req.params;
  const voucher = await prisma.voucher.findUnique({ where: { id } });
  if (!voucher) return res.status(404).json({ error: 'Voucher not found.' });
  res.json(voucher);
};

// Admin: Promos
export const createPromo = async (req: Request, res: Response) => {
  const parsed = promoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const data = parsed.data;

  const existing = await prisma.promo.findUnique({ where: { code: data.code } });
  if (existing) return res.status(409).json({ error: 'Promo code already exists.' });

  const promo = await prisma.promo.create({
    data: {
      code: data.code,
      description: sanitize(data.description),
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderAmount: data.minOrderAmount,
      expiresAt: new Date(data.expiresAt),
    },
  });

  res.status(201).json(promo);
};

export const getPromos = async (req: Request, res: Response) => {
  const promos = await prisma.promo.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(promos);
};

export const getPromoDetail = async (req: Request, res: Response) => {
  const { id } = req.params;
  const promo = await prisma.promo.findUnique({ where: { id } });
  if (!promo) return res.status(404).json({ error: 'Promo not found.' });
  res.json(promo);
};

// Public/Buyer: Validate Voucher
export const validateVoucher = async (req: Request, res: Response) => {
  const code = (req.query.code as string || '').toUpperCase().trim();
  const subtotal = parseFloat(req.query.subtotal as string) || 0;

  if (!code) return res.status(400).json({ error: 'Voucher code is required.' });

  const voucher = await prisma.voucher.findUnique({ where: { code } });
  if (!voucher) return res.status(404).json({ error: 'Invalid voucher code.' });

  // Expiry check
  if (new Date() > voucher.expiresAt) {
    return res.status(400).json({ error: 'Voucher has expired.' });
  }

  // Usage limit check
  if (voucher.usedCount >= voucher.maxUsage) {
    return res.status(400).json({ error: 'Voucher usage limit reached.' });
  }

  // Min purchase check
  if (subtotal < voucher.minOrderAmount) {
    return res.status(400).json({ error: `Voucher requires a minimum purchase of IDR ${voucher.minOrderAmount}.` });
  }

  // Calculate discount value
  let discountValue = 0;
  if (voucher.discountType === DiscountType.PERCENTAGE) {
    discountValue = subtotal * (voucher.discountValue / 100);
  } else {
    discountValue = voucher.discountValue;
  }

  res.json({
    valid: true,
    voucher,
    calculatedDiscount: Math.round(Math.min(subtotal, discountValue)),
  });
};

// Public/Buyer: Validate Promo
export const validatePromo = async (req: Request, res: Response) => {
  const code = (req.query.code as string || '').toUpperCase().trim();
  const subtotal = parseFloat(req.query.subtotal as string) || 0;

  if (!code) return res.status(400).json({ error: 'Promo code is required.' });

  const promo = await prisma.promo.findUnique({ where: { code } });
  if (!promo) return res.status(404).json({ error: 'Invalid promo code.' });

  // Expiry check
  if (new Date() > promo.expiresAt) {
    return res.status(400).json({ error: 'Promo has expired.' });
  }

  // Min purchase check
  if (subtotal < promo.minOrderAmount) {
    return res.status(400).json({ error: `Promo requires a minimum purchase of IDR ${promo.minOrderAmount}.` });
  }

  // Calculate discount value
  let discountValue = 0;
  if (promo.discountType === DiscountType.PERCENTAGE) {
    discountValue = subtotal * (promo.discountValue / 100);
  } else {
    discountValue = promo.discountValue;
  }

  res.json({
    valid: true,
    promo,
    calculatedDiscount: Math.round(Math.min(subtotal, discountValue)),
  });
};

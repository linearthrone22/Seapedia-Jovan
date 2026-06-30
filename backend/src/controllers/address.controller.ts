import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import sanitizeHtml from 'sanitize-html';

const addressSchema = z.object({
  label: z.string().min(1).max(100),
  recipientName: z.string().min(1).max(100),
  phone: z.string().min(8).max(20),
  addressLine: z.string().min(5).max(300),
  city: z.string().min(1).max(100),
  province: z.string().min(1).max(100),
  postalCode: z.string().min(3).max(10),
  isDefault: z.boolean().optional().default(false),
});

const sanitize = (str: string) => sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} });

export const getAddresses = async (req: Request, res: Response) => {
  const buyerId = req.user!.userId;
  const addresses = await prisma.deliveryAddress.findMany({
    where: { buyerId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
  res.json(addresses);
};

export const createAddress = async (req: Request, res: Response) => {
  const parsed = addressSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const data = parsed.data;

  const buyerId = req.user!.userId;

  try {
    const address = await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.deliveryAddress.updateMany({
          where: { buyerId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return await tx.deliveryAddress.create({
        data: {
          buyerId,
          label: sanitize(data.label),
          recipientName: sanitize(data.recipientName),
          phone: sanitize(data.phone),
          addressLine: sanitize(data.addressLine),
          city: sanitize(data.city),
          province: sanitize(data.province),
          postalCode: sanitize(data.postalCode),
          isDefault: data.isDefault,
        },
      });
    });

    res.status(201).json(address);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create delivery address.' });
  }
};

export const updateAddress = async (req: Request, res: Response) => {
  const { id } = req.params;
  const parsed = addressSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const data = parsed.data;

  const buyerId = req.user!.userId;

  const existing = await prisma.deliveryAddress.findUnique({ where: { id } });
  if (!existing || existing.buyerId !== buyerId) {
    return res.status(404).json({ error: 'Address not found.' });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.deliveryAddress.updateMany({
          where: { buyerId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return await tx.deliveryAddress.update({
        where: { id },
        data: {
          label: sanitize(data.label),
          recipientName: sanitize(data.recipientName),
          phone: sanitize(data.phone),
          addressLine: sanitize(data.addressLine),
          city: sanitize(data.city),
          province: sanitize(data.province),
          postalCode: sanitize(data.postalCode),
          isDefault: data.isDefault,
        },
      });
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update address.' });
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  const { id } = req.params;
  const buyerId = req.user!.userId;

  const existing = await prisma.deliveryAddress.findUnique({ where: { id } });
  if (!existing || existing.buyerId !== buyerId) {
    return res.status(404).json({ error: 'Address not found.' });
  }

  await prisma.deliveryAddress.delete({ where: { id } });
  res.json({ message: 'Address deleted successfully.' });
};

export const setDefaultAddress = async (req: Request, res: Response) => {
  const { id } = req.params;
  const buyerId = req.user!.userId;

  const existing = await prisma.deliveryAddress.findUnique({ where: { id } });
  if (!existing || existing.buyerId !== buyerId) {
    return res.status(404).json({ error: 'Address not found.' });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.deliveryAddress.updateMany({
        where: { buyerId, isDefault: true },
        data: { isDefault: false },
      });

      return await tx.deliveryAddress.update({
        where: { id },
        data: { isDefault: true },
      });
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to set default address.' });
  }
};

import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { executeCheckout } from '../services/checkout.service';
import { DeliveryMethod } from '@prisma/client';

const checkoutSchema = z.object({
  deliveryMethod: z.nativeEnum(DeliveryMethod),
  deliveryAddressId: z.string().min(1),
});

export const checkout = async (req: Request, res: Response) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { deliveryMethod, deliveryAddressId } = parsed.data;

  const buyerId = req.user!.userId;

  try {
    const order = await executeCheckout({
      buyerId,
      deliveryMethod,
      deliveryAddressId,
    });
    res.status(201).json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Checkout failed.' });
  }
};

export const getBuyerOrders = async (req: Request, res: Response) => {
  const buyerId = req.user!.userId;

  const orders = await prisma.order.findMany({
    where: { buyerId },
    include: {
      store: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(orders);
};

export const getBuyerOrderDetail = async (req: Request, res: Response) => {
  const { id } = req.params;
  const buyerId = req.user!.userId;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      store: { select: { id: true, name: true } },
      deliveryAddress: true,
      items: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!order || order.buyerId !== buyerId) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  res.json(order);
};

export const getSellerOrders = async (req: Request, res: Response) => {
  const sellerId = req.user!.userId;

  const orders = await prisma.order.findMany({
    where: { sellerId },
    include: {
      buyer: { select: { username: true } },
      deliveryAddress: true,
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(orders);
};

export const getSellerOrderDetail = async (req: Request, res: Response) => {
  const { id } = req.params;
  const sellerId = req.user!.userId;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      buyer: { select: { username: true, email: true } },
      deliveryAddress: true,
      items: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!order || order.sellerId !== sellerId) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  res.json(order);
};

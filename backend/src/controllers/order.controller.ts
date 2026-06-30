import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { executeCheckout } from '../services/checkout.service';
import { DeliveryMethod } from '@prisma/client';

const checkoutSchema = z.object({
  deliveryMethod: z.nativeEnum(DeliveryMethod),
  deliveryAddressId: z.string().min(1),
  voucherCode: z.string().optional(),
  promoCode: z.string().optional(),
});

export const checkout = async (req: Request, res: Response) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { deliveryMethod, deliveryAddressId, voucherCode, promoCode } = parsed.data;

  const buyerId = req.user!.userId;

  try {
    const order = await executeCheckout({
      buyerId,
      deliveryMethod,
      deliveryAddressId,
      voucherCode,
      promoCode,
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

export const processOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const sellerId = req.user!.userId;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
      });

      if (!order || order.sellerId !== sellerId) {
        throw new Error('Order not found.');
      }

      if (order.status !== 'SEDANG_DIKEMAS') {
        throw new Error('Order must be in packaging status (SEDANG_DIKEMAS) to process.');
      }

      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status: 'MENUNGGU_PENGIRIM' },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'MENUNGGU_PENGIRIM',
          note: 'Order processed by seller and waiting for driver pickup.',
        },
      });

      await tx.deliveryJob.create({
        data: {
          orderId: order.id,
          deliveryFee: order.deliveryFee,
          status: 'AVAILABLE',
        },
      });

      return updatedOrder;
    });

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to process order.' });
  }
};

export const getBuyerReports = async (req: Request, res: Response) => {
  const buyerId = req.user!.userId;

  const allOrders = await prisma.order.findMany({
    where: { buyerId },
  });

  const completedOrders = allOrders.filter(o => o.status === 'PESANAN_SELESAI');
  const totalSpent = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const statusBreakdown = allOrders.reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  res.json({
    totalSpent,
    orderCount: allOrders.length,
    statusBreakdown,
  });
};

export const getSellerReports = async (req: Request, res: Response) => {
  const sellerId = req.user!.userId;

  const allOrders = await prisma.order.findMany({
    where: { sellerId },
  });

  const completedOrders = allOrders.filter(o => o.status === 'PESANAN_SELESAI');
  const totalIncome = completedOrders.reduce((sum, o) => sum + (o.totalAmount - o.deliveryFee), 0);

  // Group by month (YYYY-MM)
  const monthlyData: Record<string, { income: number; orderCount: number }> = {};

  completedOrders.forEach((o) => {
    const month = o.createdAt.toISOString().slice(0, 7); // "YYYY-MM"
    if (!monthlyData[month]) {
      monthlyData[month] = { income: 0, orderCount: 0 };
    }
    monthlyData[month].income += o.totalAmount - o.deliveryFee;
    monthlyData[month].orderCount += 1;
  });

  const monthlyBreakdown = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    income: data.income,
    orderCount: data.orderCount,
  })).sort((a, b) => a.month.localeCompare(b.month));

  res.json({
    totalIncome,
    orderCount: allOrders.length,
    monthlyBreakdown,
  });
};


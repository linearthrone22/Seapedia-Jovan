import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { OrderStatus, DeliveryJobStatus, TransactionType } from '@prisma/client';

const advanceTimeSchema = z.object({
  days: z.number().int().positive().max(365),
});

export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    const storeCount = await prisma.store.count();
    const productCount = await prisma.product.count();
    const orderCount = await prisma.order.count();

    const completedOrders = await prisma.order.findMany({
      where: { status: OrderStatus.PESANAN_SELESAI },
      select: { taxAmount: true },
    });

    const platformRevenue = completedOrders.reduce((sum, o) => sum + o.taxAmount, 0);

    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { username: true } },
        store: { select: { name: true } },
      },
    });

    res.json({
      userCount,
      storeCount,
      productCount,
      orderCount,
      platformRevenue,
      recentOrders,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch admin stats.' });
  }
};

export const advanceTime = async (req: Request, res: Response) => {
  const parsed = advanceTimeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { days } = parsed.data;

  try {
    // 1. Shift timestamps back using raw SQL (simulate time passing forward)
    await prisma.$executeRaw`UPDATE "Order" SET "createdAt" = "createdAt" - (${days} * interval '1 day'), "updatedAt" = "updatedAt" - (${days} * interval '1 day')`;
    await prisma.$executeRaw`UPDATE "DeliveryJob" SET "createdAt" = "createdAt" - (${days} * interval '1 day'), "updatedAt" = "updatedAt" - (${days} * interval '1 day')`;
    await prisma.$executeRaw`UPDATE "OrderStatusHistory" SET "createdAt" = "createdAt" - (${days} * interval '1 day')`;

    const autoCanceled: string[] = [];
    const autoCompleted: string[] = [];

    // 2. Fetch Overdue Packaging Orders (> 4 days in SEDANG_DIKEMAS)
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    const packagingOverdue = await prisma.order.findMany({
      where: {
        status: OrderStatus.SEDANG_DIKEMAS,
        createdAt: { lt: fourDaysAgo },
      },
      include: { items: true },
    });

    for (const order of packagingOverdue) {
      await prisma.$transaction(async (tx) => {
        // Cancel order
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.DIKEMBALIKAN },
        });

        // Log history
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: OrderStatus.DIKEMBALIKAN,
            note: 'System auto-canceled order due to merchant packaging delay (exceeded 4 days SLA).',
          },
        });

        // Refund buyer wallet
        let wallet = await tx.wallet.findUnique({ where: { buyerId: order.buyerId } });
        if (!wallet) {
          wallet = await tx.wallet.create({ data: { buyerId: order.buyerId } });
        }
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: order.totalAmount } },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: TransactionType.REFUND,
            amount: order.totalAmount,
            description: `Auto-refund for packaging delay of order #${order.id.slice(-8)}`,
            orderId: order.id,
          },
        });

        // Restore product stock
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        // Delete delivery job if it was created
        await tx.deliveryJob.deleteMany({
          where: { orderId: order.id },
        });
      });
      autoCanceled.push(order.id);
    }

    // 3. Fetch Overdue Transit Orders (> 3 days in SEDANG_DIKIRIM)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const transitOverdue = await prisma.deliveryJob.findMany({
      where: {
        status: DeliveryJobStatus.PICKED_UP,
        updatedAt: { lt: threeDaysAgo },
      },
      include: { order: true },
    });

    for (const job of transitOverdue) {
      if (!job.driverId) continue;
      await prisma.$transaction(async (tx) => {
        // Complete job
        await tx.deliveryJob.update({
          where: { id: job.id },
          data: { status: DeliveryJobStatus.DELIVERED },
        });

        // Complete order
        await tx.order.update({
          where: { id: job.orderId },
          data: { status: OrderStatus.PESANAN_SELESAI },
        });

        // Log history
        await tx.orderStatusHistory.create({
          data: {
            orderId: job.orderId,
            status: OrderStatus.PESANAN_SELESAI,
            note: 'System auto-completed order: transit duration exceeded 3 days SLA.',
          },
        });

        // Payout Seller
        const sellerPayout = job.order.totalAmount - job.order.deliveryFee;
        let sellerWallet = await tx.wallet.findUnique({ where: { buyerId: job.order.sellerId } });
        if (!sellerWallet) {
          sellerWallet = await tx.wallet.create({ data: { buyerId: job.order.sellerId } });
        }
        await tx.wallet.update({
          where: { id: sellerWallet.id },
          data: { balance: { increment: sellerPayout } },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: sellerWallet.id,
            type: TransactionType.INCOME,
            amount: sellerPayout,
            description: `Auto-earnings payout for order #${job.order.id.slice(-8)}`,
            orderId: job.orderId,
          },
        });

        // Payout Driver
        const driverPayout = job.order.deliveryFee;
        let driverWallet = await tx.wallet.findUnique({ where: { buyerId: job.driverId! } });
        if (!driverWallet) {
          driverWallet = await tx.wallet.create({ data: { buyerId: job.driverId! } });
        }
        await tx.wallet.update({
          where: { id: driverWallet.id },
          data: { balance: { increment: driverPayout } },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: driverWallet.id,
            type: TransactionType.INCOME,
            amount: driverPayout,
            description: `Auto-delivery payout for order #${job.order.id.slice(-8)}`,
            orderId: job.orderId,
          },
        });
      });
      autoCompleted.push(job.orderId);
    }

    res.json({
      message: `System advanced by ${days} days. Checked and processed SLA overdue policies.`,
      autoCanceled,
      autoCompleted,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Simulation error.' });
  }
};

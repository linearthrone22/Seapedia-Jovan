import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { DeliveryJobStatus, OrderStatus, TransactionType } from '@prisma/client';

// 1. Get Available Jobs
export const getAvailableJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await prisma.deliveryJob.findMany({
      where: { status: DeliveryJobStatus.AVAILABLE },
      include: {
        order: {
          include: {
            store: { select: { name: true } },
            deliveryAddress: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(jobs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch available delivery jobs.' });
  }
};

// 2. Accept Job
export const acceptJob = async (req: Request, res: Response) => {
  const { id } = req.params;
  const driverId = req.user!.userId;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Check active job constraint
      const activeJob = await tx.deliveryJob.findFirst({
        where: {
          driverId,
          status: { in: [DeliveryJobStatus.ACCEPTED, DeliveryJobStatus.PICKED_UP] },
        },
      });

      if (activeJob) {
        throw new Error('You already have an active delivery job. Complete it first.');
      }

      // Check job availability
      const job = await tx.deliveryJob.findUnique({
        where: { id },
      });

      if (!job || job.status !== DeliveryJobStatus.AVAILABLE) {
        throw new Error('This job is no longer available.');
      }

      // Update job status to ACCEPTED
      const updatedJob = await tx.deliveryJob.update({
        where: { id },
        data: {
          driverId,
          status: DeliveryJobStatus.ACCEPTED,
        },
      });

      // Update order status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: job.orderId,
          status: OrderStatus.MENUNGGU_PENGIRIM,
          note: `Delivery job accepted by courier.`,
        },
      });

      return updatedJob;
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to accept delivery job.' });
  }
};

// 3. Pick Up Package
export const pickupJob = async (req: Request, res: Response) => {
  const { id } = req.params;
  const driverId = req.user!.userId;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const job = await tx.deliveryJob.findUnique({ where: { id } });

      if (!job || job.driverId !== driverId || job.status !== DeliveryJobStatus.ACCEPTED) {
        throw new Error('Delivery job is not accepted or not assigned to you.');
      }

      // Transition job to PICKED_UP
      const updatedJob = await tx.deliveryJob.update({
        where: { id },
        data: { status: DeliveryJobStatus.PICKED_UP },
      });

      // Transition order status to SEDANG_DIKIRIM
      await tx.order.update({
        where: { id: job.orderId },
        data: { status: OrderStatus.SEDANG_DIKIRIM },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: job.orderId,
          status: OrderStatus.SEDANG_DIKIRIM,
          note: 'Package picked up by courier. On the way to destination.',
        },
      });

      return updatedJob;
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to pick up package.' });
  }
};

// 4. Complete Delivery (Payout transaction)
export const deliverJob = async (req: Request, res: Response) => {
  const { id } = req.params;
  const driverId = req.user!.userId;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const job = await tx.deliveryJob.findUnique({
        where: { id },
        include: { order: true },
      });

      if (!job || job.driverId !== driverId || job.status !== DeliveryJobStatus.PICKED_UP) {
        throw new Error('Delivery job is not in shipping state or not assigned to you.');
      }

      // Update job to DELIVERED
      const updatedJob = await tx.deliveryJob.update({
        where: { id },
        data: { status: DeliveryJobStatus.DELIVERED },
      });

      // Transition order to PESANAN_SELESAI
      await tx.order.update({
        where: { id: job.orderId },
        data: { status: OrderStatus.PESANAN_SELESAI },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: job.orderId,
          status: OrderStatus.PESANAN_SELESAI,
          note: 'Order delivered successfully by courier.',
        },
      });

      // --- Payout Distributions ---

      // 1. Seller Payout: Order Total minus Delivery Fee
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
          description: `Earnings payout for order #${job.order.id.slice(-8)}`,
          orderId: job.orderId,
        },
      });

      // 2. Driver Payout: Delivery Fee
      const driverPayout = job.order.deliveryFee;
      let driverWallet = await tx.wallet.findUnique({ where: { buyerId: driverId } });
      if (!driverWallet) {
        driverWallet = await tx.wallet.create({ data: { buyerId: driverId } });
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
          description: `Delivery fee payout for order #${job.order.id.slice(-8)}`,
          orderId: job.orderId,
        },
      });

      return updatedJob;
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to complete delivery.' });
  }
};

// 5. Fail Delivery (Rollback & Refund transaction)
export const failJob = async (req: Request, res: Response) => {
  const { id } = req.params;
  const driverId = req.user!.userId;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const job = await tx.deliveryJob.findUnique({
        where: { id },
        include: { order: true },
      });

      if (!job || job.driverId !== driverId || job.status !== DeliveryJobStatus.PICKED_UP) {
        throw new Error('Delivery job is not in shipping state or not assigned to you.');
      }

      // Update job status to FAILED
      const updatedJob = await tx.deliveryJob.update({
        where: { id },
        data: { status: DeliveryJobStatus.FAILED },
      });

      // Transition order status to DIKEMBALIKAN
      await tx.order.update({
        where: { id: job.orderId },
        data: { status: OrderStatus.DIKEMBALIKAN },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: job.orderId,
          status: OrderStatus.DIKEMBALIKAN,
          note: 'Courier delivery failed. Package is scheduled for merchant return.',
        },
      });

      // --- Refund Payout ---
      // Refund the buyer's wallet with the full order total
      let buyerWallet = await tx.wallet.findUnique({ where: { buyerId: job.order.buyerId } });
      if (!buyerWallet) {
        buyerWallet = await tx.wallet.create({ data: { buyerId: job.order.buyerId } });
      }

      await tx.wallet.update({
        where: { id: buyerWallet.id },
        data: { balance: { increment: job.order.totalAmount } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: buyerWallet.id,
          type: TransactionType.REFUND,
          amount: job.order.totalAmount,
          description: `Full refund for failed delivery of order #${job.order.id.slice(-8)}`,
          orderId: job.orderId,
        },
      });

      return updatedJob;
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to roll back delivery.' });
  }
};

// 6. Get Active Job
export const getActiveJob = async (req: Request, res: Response) => {
  const driverId = req.user!.userId;

  try {
    const job = await prisma.deliveryJob.findFirst({
      where: {
        driverId,
        status: { in: [DeliveryJobStatus.ACCEPTED, DeliveryJobStatus.PICKED_UP] },
      },
      include: {
        order: {
          include: {
            store: { select: { name: true } },
            deliveryAddress: true,
            items: true,
          },
        },
      },
    });

    res.json(job);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch active job.' });
  }
};

// 7. Get History
export const getDriverHistory = async (req: Request, res: Response) => {
  const driverId = req.user!.userId;

  try {
    const history = await prisma.deliveryJob.findMany({
      where: {
        driverId,
        status: { in: [DeliveryJobStatus.DELIVERED, DeliveryJobStatus.FAILED] },
      },
      include: {
        order: {
          include: {
            store: { select: { name: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch delivery history.' });
  }
};

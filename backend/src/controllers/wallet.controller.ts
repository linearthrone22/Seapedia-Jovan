import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { TransactionType } from '@prisma/client';

const topupSchema = z.object({
  amount: z.number().positive().max(10000000),
});

export const getWallet = async (req: Request, res: Response) => {
  const buyerId = req.user!.userId;

  let wallet = await prisma.wallet.findUnique({
    where: { buyerId },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { buyerId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
  }

  res.json(wallet);
};

export const topupWallet = async (req: Request, res: Response) => {
  const parsed = topupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { amount } = parsed.data;

  const buyerId = req.user!.userId;

  try {
    const result = await prisma.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({ where: { buyerId } });
      if (!wallet) {
        wallet = await tx.wallet.create({ data: { buyerId } });
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });

      const txLog = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.TOPUP,
          amount,
          description: `Top-up wallet via bank transfer`,
        },
      });

      return { wallet: updatedWallet, transaction: txLog };
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to process topup transaction.' });
  }
};

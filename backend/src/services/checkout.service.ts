import { prisma } from '../utils/prisma';
import { DeliveryMethod, OrderStatus, TransactionType, Order, DiscountType } from '@prisma/client';

export const DELIVERY_FEES: Record<DeliveryMethod, number> = {
  INSTANT: 25000,
  NEXT_DAY: 15000,
  REGULAR: 9000,
};

interface CheckoutParams {
  buyerId: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddressId: string;
  voucherCode?: string;
  promoCode?: string;
}

export const executeCheckout = async ({
  buyerId,
  deliveryMethod,
  deliveryAddressId,
  voucherCode,
  promoCode,
}: CheckoutParams): Promise<Order> => {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch Cart and items
    const cart = await tx.cart.findUnique({
      where: { buyerId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new Error('Your cart is empty.');
    }

    if (!cart.storeId) {
      throw new Error('Store identification missing from cart.');
    }

    // 2. Validate Address
    const address = await tx.deliveryAddress.findUnique({
      where: { id: deliveryAddressId },
    });
    if (!address || address.buyerId !== buyerId) {
      throw new Error('Invalid delivery address.');
    }

    // 3. Compute Subtotal
    const subtotal = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    // 4. Compute Discounts
    let voucherDiscount = 0;
    let voucherId: string | null = null;
    let promoDiscount = 0;
    let promoId: string | null = null;

    // Apply Voucher First
    if (voucherCode) {
      const voucher = await tx.voucher.findUnique({
        where: { code: voucherCode.toUpperCase().trim() },
      });

      if (!voucher) {
        throw new Error('Invalid voucher code.');
      }

      if (new Date() > voucher.expiresAt) {
        throw new Error('Voucher has expired.');
      }

      if (voucher.usedCount >= voucher.maxUsage) {
        throw new Error('Voucher usage limit has been reached.');
      }

      if (subtotal < voucher.minOrderAmount) {
        throw new Error(`Voucher requires a minimum purchase of IDR ${voucher.minOrderAmount}.`);
      }

      if (voucher.discountType === DiscountType.PERCENTAGE) {
        voucherDiscount = subtotal * (voucher.discountValue / 100);
      } else {
        voucherDiscount = voucher.discountValue;
      }

      voucherDiscount = Math.min(subtotal, voucherDiscount);
      voucherId = voucher.id;

      // Increment voucher usage
      await tx.voucher.update({
        where: { id: voucher.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Apply Promo Second on the remainder
    const remainder = subtotal - voucherDiscount;
    if (promoCode && remainder > 0) {
      const promo = await tx.promo.findUnique({
        where: { code: promoCode.toUpperCase().trim() },
      });

      if (!promo) {
        throw new Error('Invalid promo code.');
      }

      if (new Date() > promo.expiresAt) {
        throw new Error('Promo has expired.');
      }

      if (subtotal < promo.minOrderAmount) {
        throw new Error(`Promo requires a minimum purchase of IDR ${promo.minOrderAmount}.`);
      }

      if (promo.discountType === DiscountType.PERCENTAGE) {
        promoDiscount = remainder * (promo.discountValue / 100);
      } else {
        promoDiscount = promo.discountValue;
      }

      promoDiscount = Math.min(remainder, promoDiscount);
      promoId = promo.id;
    }

    const totalDiscount = Math.min(subtotal, voucherDiscount + promoDiscount);

    // 5. Compute Fees and Taxes
    const deliveryFee = DELIVERY_FEES[deliveryMethod];
    const taxBase = subtotal - totalDiscount + deliveryFee;
    const taxAmount = Math.round(taxBase * 0.12); // PPN 12%
    const totalAmount = taxBase + taxAmount;

    // 6. Fetch and Validate Wallet
    const wallet = await tx.wallet.findUnique({ where: { buyerId } });
    if (!wallet || wallet.balance < totalAmount) {
      throw new Error(`Insufficient wallet balance. Total required is IDR ${totalAmount}, but your balance is IDR ${wallet?.balance || 0}.`);
    }

    // 7. Deduct Wallet Balance & Log Transaction
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: totalAmount } },
    });

    // 8. Verify Product Stock & Update
    for (const item of cart.items) {
      const dbProduct = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!dbProduct || !dbProduct.isActive) {
        throw new Error(`Product "${item.product.name}" is no longer available.`);
      }

      if (dbProduct.stock < item.quantity) {
        throw new Error(`Insufficient stock for "${dbProduct.name}". Only ${dbProduct.stock} units left.`);
      }

      // Decrement stock
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // 9. Fetch store to get sellerId
    const store = await tx.store.findUnique({
      where: { id: cart.storeId },
    });
    if (!store) {
      throw new Error('Merchant store not found.');
    }

    // 10. Create Order
    const order = await tx.order.create({
      data: {
        buyerId,
        sellerId: store.sellerId,
        storeId: cart.storeId,
        deliveryMethod,
        deliveryAddressId,
        subtotal,
        discountAmount: totalDiscount,
        deliveryFee,
        taxAmount,
        totalAmount,
        status: OrderStatus.SEDANG_DIKEMAS,
        voucherId,
        promoId,
      },
    });

    // Log Wallet Payment Transaction
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: TransactionType.PAYMENT,
        amount: totalAmount,
        description: `Payment for order #${order.id.slice(-8)}`,
        orderId: order.id,
      },
    });

    // 11. Create Order Items
    for (const item of cart.items) {
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          productName: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
        },
      });
    }

    // 12. Create Order Status History Log
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: OrderStatus.SEDANG_DIKEMAS,
        note: 'Order placed and paid successfully.',
      },
    });

    // 13. Clear Cart
    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    await tx.cart.update({
      where: { id: cart.id },
      data: { storeId: null },
    });

    return order;
  });
};

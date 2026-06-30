import { prisma } from '../utils/prisma';
import { DeliveryMethod, OrderStatus, TransactionType, Order } from '@prisma/client';

export const DELIVERY_FEES: Record<DeliveryMethod, number> = {
  INSTANT: 25000,
  NEXT_DAY: 15000,
  REGULAR: 9000,
};

interface CheckoutParams {
  buyerId: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddressId: string;
}

export const executeCheckout = async ({
  buyerId,
  deliveryMethod,
  deliveryAddressId,
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

    // 4. Compute Discounts (Default to 0 in Level 3)
    const discountAmount = 0;

    // 5. Compute Fees and Taxes
    const deliveryFee = DELIVERY_FEES[deliveryMethod];
    const taxBase = subtotal - discountAmount + deliveryFee;
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
      // Re-fetch product with transaction lock
      const dbProduct = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!dbProduct || !dbProduct.isActive) {
        throw new Error(`Product "${item.product.name}" is no longer available.`);
      }

      if (dbProduct.stock < item.quantity) {
        throw new Error(`Insufficient stock for "${dbProduct.name}". Only ${dbProduct.stock} units left, but your cart has ${item.quantity}.`);
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
        discountAmount,
        deliveryFee,
        taxAmount,
        totalAmount,
        status: OrderStatus.SEDANG_DIKEMAS,
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

import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';

const addCartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().max(100),
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().positive().max(100),
});

export const getCart = async (req: Request, res: Response) => {
  const buyerId = req.user!.userId;

  let cart = await prisma.cart.findUnique({
    where: { buyerId },
    include: {
      store: { select: { id: true, name: true } },
      items: {
        include: {
          product: {
            select: { id: true, name: true, price: true, stock: true, imageUrl: true },
          },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { buyerId },
      include: {
        store: { select: { id: true, name: true } },
        items: {
          include: {
            product: {
              select: { id: true, name: true, price: true, stock: true, imageUrl: true },
            },
          },
        },
      },
    });
  }

  // Compute subtotal
  const subtotal = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  res.json({ ...cart, subtotal });
};

export const addCartItem = async (req: Request, res: Response) => {
  const parsed = addCartItemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { productId, quantity } = parsed.data;

  const buyerId = req.user!.userId;

  // 1. Fetch product & check stock
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { store: true },
  });

  if (!product || !product.isActive) {
    return res.status(404).json({ error: 'Product not found or inactive.' });
  }

  if (product.stock < quantity) {
    return res.status(400).json({ error: `Insufficient stock. Only ${product.stock} units available.` });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 2. Fetch or create cart
      let cart = await tx.cart.findUnique({
        where: { buyerId },
        include: { items: true },
      });

      if (!cart) {
        cart = await tx.cart.create({
          data: { buyerId },
          include: { items: true },
        });
      }

      // 3. Single store check
      if (cart.storeId && cart.storeId !== product.storeId) {
        throw {
          status: 409,
          message: `Your cart contains items from "${cart.storeId}" (or another store). You can only checkout from one store at a time. Clear your cart first.`,
        };
      }

      // 4. Update cart storeId if null
      if (!cart.storeId) {
        await tx.cart.update({
          where: { id: cart.id },
          data: { storeId: product.storeId },
        });
      }

      // 5. Check if item already in cart
      const existingItem = await tx.cartItem.findUnique({
        where: {
          cartId_productId: { cartId: cart.id, productId },
        },
      });

      let cartItem;
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (product.stock < newQuantity) {
          throw {
            status: 400,
            message: `Cannot add more units. Total quantity would exceed available stock (${product.stock}).`,
          };
        }
        cartItem = await tx.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
        });
      } else {
        cartItem = await tx.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
          },
        });
      }

      return cartItem;
    });

    res.status(201).json(result);
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to add item to cart.' });
  }
};

export const updateCartItem = async (req: Request, res: Response) => {
  const { itemId } = req.params;
  const parsed = updateCartItemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { quantity } = parsed.data;

  const buyerId = req.user!.userId;

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: {
      cart: true,
      product: true,
    },
  });

  if (!cartItem || cartItem.cart.buyerId !== buyerId) {
    return res.status(404).json({ error: 'Cart item not found.' });
  }

  if (cartItem.product.stock < quantity) {
    return res.status(400).json({ error: `Only ${cartItem.product.stock} units are available in stock.` });
  }

  const updated = await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });

  res.json(updated);
};

export const deleteCartItem = async (req: Request, res: Response) => {
  const { itemId } = req.params;
  const buyerId = req.user!.userId;

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: { include: { items: true } } },
  });

  if (!cartItem || cartItem.cart.buyerId !== buyerId) {
    return res.status(404).json({ error: 'Cart item not found.' });
  }

  await prisma.$transaction(async (tx) => {
    await tx.cartItem.delete({ where: { id: itemId } });

    // If this was the last item, reset storeId to null
    if (cartItem.cart.items.length <= 1) {
      await tx.cart.update({
        where: { id: cartItem.cart.id },
        data: { storeId: null },
      });
    }
  });

  res.json({ message: 'Item removed from cart.' });
};

export const clearCart = async (req: Request, res: Response) => {
  const buyerId = req.user!.userId;

  const cart = await prisma.cart.findUnique({ where: { buyerId } });
  if (!cart) return res.status(404).json({ error: 'Cart not found.' });

  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
    prisma.cart.update({
      where: { id: cart.id },
      data: { storeId: null },
    }),
  ]);

  res.json({ message: 'Cart cleared successfully.' });
};

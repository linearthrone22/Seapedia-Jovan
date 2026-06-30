import { Router } from 'express';
import { register, login, selectRole, logout, me } from '../controllers/auth.controller';
import { createReview, getReviews } from '../controllers/review.controller';
import { createStore, getOwnStore, updateStore, getPublicStore } from '../controllers/store.controller';
import { createProduct, getSellerProducts, updateProduct, deleteProduct, getPublicProducts, getPublicProductDetail } from '../controllers/product.controller';
import { getWallet, topupWallet } from '../controllers/wallet.controller';
import { getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from '../controllers/address.controller';
import { getCart, addCartItem, updateCartItem, deleteCartItem, clearCart } from '../controllers/cart.controller';
import { checkout, getBuyerOrders, getBuyerOrderDetail, getSellerOrders, getSellerOrderDetail, processOrder, getBuyerReports, getSellerReports } from '../controllers/order.controller';
import { createVoucher, getVouchers, getVoucherDetail, createPromo, getPromos, getPromoDetail, validateVoucher, validatePromo } from '../controllers/discount.controller';
import { verifyToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Auth Routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/select-role', verifyToken, selectRole);
router.post('/auth/logout', verifyToken, logout);
router.get('/auth/me', verifyToken, me);

// Review Routes
router.post('/reviews', async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return verifyToken(req, res, next);
  next();
}, createReview);
router.get('/reviews', getReviews);

// Store Routes (Seller)
router.post('/seller/store', verifyToken, requireRole('SELLER'), createStore);
router.get('/seller/store', verifyToken, requireRole('SELLER'), getOwnStore);
router.put('/seller/store', verifyToken, requireRole('SELLER'), updateStore);

// Store Routes (Public)
router.get('/stores/:id', getPublicStore);

// Product Routes (Seller)
router.post('/seller/products', verifyToken, requireRole('SELLER'), createProduct);
router.get('/seller/products', verifyToken, requireRole('SELLER'), getSellerProducts);
router.put('/seller/products/:id', verifyToken, requireRole('SELLER'), updateProduct);
router.delete('/seller/products/:id', verifyToken, requireRole('SELLER'), deleteProduct);

// Product Routes (Public)
router.get('/products', getPublicProducts);
router.get('/products/:id', getPublicProductDetail);

// Wallet Routes (Buyer)
router.get('/buyer/wallet', verifyToken, requireRole('BUYER'), getWallet);
router.post('/buyer/wallet/topup', verifyToken, requireRole('BUYER'), topupWallet);

// Address Routes (Buyer)
router.get('/buyer/addresses', verifyToken, requireRole('BUYER'), getAddresses);
router.post('/buyer/addresses', verifyToken, requireRole('BUYER'), createAddress);
router.put('/buyer/addresses/:id', verifyToken, requireRole('BUYER'), updateAddress);
router.delete('/buyer/addresses/:id', verifyToken, requireRole('BUYER'), deleteAddress);
router.patch('/buyer/addresses/:id/default', verifyToken, requireRole('BUYER'), setDefaultAddress);

// Cart Routes (Buyer)
router.get('/buyer/cart', verifyToken, requireRole('BUYER'), getCart);
router.post('/buyer/cart/items', verifyToken, requireRole('BUYER'), addCartItem);
router.put('/buyer/cart/items/:itemId', verifyToken, requireRole('BUYER'), updateCartItem);
router.delete('/buyer/cart/items/:itemId', verifyToken, requireRole('BUYER'), deleteCartItem);
router.delete('/buyer/cart', verifyToken, requireRole('BUYER'), clearCart);

// Checkout & Order Routes (Buyer)
router.post('/buyer/checkout', verifyToken, requireRole('BUYER'), checkout);
router.get('/buyer/orders', verifyToken, requireRole('BUYER'), getBuyerOrders);
router.get('/buyer/orders/:id', verifyToken, requireRole('BUYER'), getBuyerOrderDetail);

// Order Routes (Seller)
router.get('/seller/orders', verifyToken, requireRole('SELLER'), getSellerOrders);
router.get('/seller/orders/:id', verifyToken, requireRole('SELLER'), getSellerOrderDetail);
router.patch('/seller/orders/:id/process', verifyToken, requireRole('SELLER'), processOrder);

// Discount Validation (Public / Buyer)
router.get('/vouchers/validate', validateVoucher);
router.get('/promos/validate', validatePromo);

// Discount Administration (Admin)
router.post('/admin/vouchers', verifyToken, requireRole('ADMIN'), createVoucher);
router.get('/admin/vouchers', verifyToken, requireRole('ADMIN'), getVouchers);
router.get('/admin/vouchers/:id', verifyToken, requireRole('ADMIN'), getVoucherDetail);
router.post('/admin/promos', verifyToken, requireRole('ADMIN'), createPromo);
router.get('/admin/promos', verifyToken, requireRole('ADMIN'), getPromos);
router.get('/admin/promos/:id', verifyToken, requireRole('ADMIN'), getPromoDetail);

// Reports
router.get('/buyer/reports', verifyToken, requireRole('BUYER'), getBuyerReports);
router.get('/seller/reports', verifyToken, requireRole('SELLER'), getSellerReports);

// Health Check
router.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

export default router;
